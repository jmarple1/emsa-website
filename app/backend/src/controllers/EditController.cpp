#include "EditController.h"
#include "utils/ContentBlocks.h"
#include "utils/Http.h"
#include <drogon/drogon.h>
#include <regex>
#include <set>
#include <sstream>

using drogon::orm::DrogonDbException;
using drogon::orm::Result;
using Callback = EditController::Callback;

// Officers type times as Oxford, Ohio local time ("2026-10-04T13:00", from
// <input type="datetime-local">). PostgreSQL converts them, so an officer's
// laptop time zone can never shift a class.
#define TZ "'America/New_York'"
#define LOCAL_IN(n) "($" #n "::timestamp AT TIME ZONE " TZ ")"
#define LOCAL_OUT(col) "to_char(" col " AT TIME ZONE " TZ ", 'YYYY-MM-DD\"T\"HH24:MI')"

namespace {

void sendOk(const Callback& cb) {
    Json::Value body;
    body["ok"] = true;
    cb(drogon::HttpResponse::newHttpJsonResponse(body));
}

void jsonQuery(const std::string& sql, const Callback& cb) {
    drogon::app().getDbClient()->execSqlAsync(
        sql,
        [cb](const Result& r) { Http::sendJsonText(r, cb); },
        [cb](const DrogonDbException&) {
            cb(Http::jsonError(drogon::k500InternalServerError, "Could not load data"));
        });
}

auto dbError(const Callback& cb) {
    return [cb](const DrogonDbException&) {
        cb(Http::jsonError(drogon::k500InternalServerError, "Could not save. Please try again."));
    };
}

// Runs a write that ends in "RETURNING id"; 404 when nothing matched.
template <typename... Args>
void writeOne(const std::string& sql, const Callback& cb, Args&&... args) {
    drogon::app().getDbClient()->execSqlAsync(
        sql,
        [cb](const Result& r) {
            if (r.empty()) cb(Http::jsonError(drogon::k404NotFound, "Not found. It may have been deleted."));
            else sendOk(cb);
        },
        dbError(cb), std::forward<Args>(args)...);
}

const Json::Value* body(const drogon::HttpRequestPtr& req, const Callback& cb) {
    auto j = req->getJsonObject();
    if (!j || !j->isObject()) {
        cb(Http::jsonError(drogon::k400BadRequest, "Invalid JSON body"));
        return nullptr;
    }
    return j.get();
}

bool isLocalDateTime(const std::string& s) {
    static const std::regex re(R"(^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$)");
    return std::regex_match(s, re);
}

bool isHttpsUrl(const std::string& s) {
    static const std::regex re(R"(^https://[^\s<>"]+$)");
    return s.size() <= 500 && std::regex_match(s, re);
}

std::vector<std::string> splitLines(const std::string& s) {
    std::vector<std::string> out;
    std::istringstream in(s);
    std::string line;
    while (std::getline(in, line)) {
        if (!line.empty() && line.back() == '\r') line.pop_back();
        const auto b = line.find_first_not_of(" \t");
        if (b == std::string::npos) continue;
        out.push_back(line.substr(b, line.find_last_not_of(" \t") - b + 1));
    }
    return out;
}

// Returns "" when valid, otherwise the message to show next to the field.
std::string checkBlock(ContentBlocks::Kind kind, const std::string& v) {
    using K = ContentBlocks::Kind;
    switch (kind) {
    case K::Text:
        if (v.find('\n') != std::string::npos) return "Keep this to one line.";
        return v.size() > 300 ? "Keep this under 300 characters." : "";
    case K::Paragraph:
        return v.size() > 2000 ? "Keep this under 2,000 characters." : "";
    case K::Lines: {
        const auto lines = splitLines(v);
        if (lines.size() > 20) return "Use 20 lines or fewer.";
        for (const auto& l : lines)
            if (l.size() > 200) return "Keep each line under 200 characters.";
        return "";
    }
    case K::Email:
        return Http::isEmail(v) ? "" : "Enter one valid email address.";
    case K::Url:
        return isHttpsUrl(v) ? "" : "Enter one web address starting with https://";
    case K::Links: {
        const auto lines = splitLines(v);
        if (lines.size() > 10) return "Use 10 links or fewer.";
        for (const auto& l : lines) {
            const auto bar = l.find('|');
            if (bar == std::string::npos)
                return "Write each link as: Label | https://...";
            std::string label = l.substr(0, bar), url = l.substr(bar + 1);
            label.erase(label.find_last_not_of(" \t") + 1);
            url.erase(0, url.find_first_not_of(" \t"));
            if (label.empty() || label.size() > 60) return "Each link needs a short label (under 60 characters).";
            if (!isHttpsUrl(url)) return "Each link must start with https://";
        }
        return "";
    }
    case K::People: {
        const auto lines = splitLines(v);
        if (lines.size() > 20) return "List 20 people or fewer.";
        for (const auto& l : lines) {
            const auto bar = l.find('|');
            if (bar == std::string::npos) return "Write each person as: Name | Role";
            std::string name = l.substr(0, bar), role = l.substr(bar + 1);
            name.erase(name.find_last_not_of(" \t") + 1);
            role.erase(0, role.find_first_not_of(" \t"));
            if (name.empty() || role.empty()) return "Each person needs a name and a role.";
            if (name.size() > 100 || role.size() > 100) return "Keep each name and role under 100 characters.";
        }
        return "";
    }
    }
    return "Unknown content type.";
}

struct ClassInput {
    std::string course, starts, ends, location;
    int capacity = 0;
    bool isOpen = true;
};

bool readClass(const Json::Value& j, ClassInput& c, Json::Value& errors) {
    static const std::set<std::string> COURSES = {"BLS", "Heartsaver", "Stop the Bleed"};
    c.course = Http::str(j, "course");
    c.starts = Http::str(j, "starts_at");
    c.ends = Http::str(j, "ends_at");
    c.location = Http::str(j, "location");
    if (j.isMember("capacity") && j["capacity"].isInt()) c.capacity = j["capacity"].asInt();
    c.isOpen = !j.isMember("is_open") || !j["is_open"].isBool() || j["is_open"].asBool();

    if (!COURSES.count(c.course)) errors["course"] = "Choose a course.";
    if (!isLocalDateTime(c.starts)) errors["starts_at"] = "Enter a start date and time.";
    if (!isLocalDateTime(c.ends)) errors["ends_at"] = "Enter an end date and time.";
    else if (isLocalDateTime(c.starts) && c.ends <= c.starts) errors["ends_at"] = "End time must be after the start time.";
    if (c.location.empty() || c.location.size() > 300) errors["location"] = "Enter where the class meets.";
    if (c.capacity < 1 || c.capacity > 500) errors["capacity"] = "Enter a capacity from 1 to 500.";
    return errors.empty();
}

struct EventInput {
    std::string title, starts, ends, location, description;
};

bool readEvent(const Json::Value& j, EventInput& e, Json::Value& errors) {
    e.title = Http::str(j, "title");
    e.starts = Http::str(j, "starts_at");
    e.ends = Http::str(j, "ends_at");
    e.location = Http::str(j, "location");
    e.description = Http::str(j, "description");

    if (e.title.empty() || e.title.size() > 200) errors["title"] = "Enter a title (under 200 characters).";
    if (!isLocalDateTime(e.starts)) errors["starts_at"] = "Enter a start date and time.";
    if (!e.ends.empty()) {
        if (!isLocalDateTime(e.ends)) errors["ends_at"] = "Enter a valid end date and time, or leave it blank.";
        else if (isLocalDateTime(e.starts) && e.ends <= e.starts) errors["ends_at"] = "End time must be after the start time.";
    }
    if (e.location.size() > 300) errors["location"] = "Keep the location under 300 characters.";
    if (e.description.size() > 2000) errors["description"] = "Keep the description under 2,000 characters.";
    return errors.empty();
}

} // namespace

// ---------------------------------------------------------------------------
// Content blocks
// ---------------------------------------------------------------------------
void EditController::listContent(const Req&, Callback&& cb) {
    jsonQuery("SELECT COALESCE(json_object_agg(key, value), '{}'::json) FROM site_settings", cb);
}

void EditController::saveContent(const Req& req, Callback&& cb, std::string key) {
    const auto* block = ContentBlocks::find(key);
    if (!block) {
        cb(Http::jsonError(drogon::k404NotFound, "Unknown content block"));
        return;
    }
    const auto* j = body(req, cb);
    if (!j) return;

    std::string value = (*j).isMember("value") && (*j)["value"].isString() ? (*j)["value"].asString() : "";
    // Normalize line endings and trim.
    std::string clean;
    for (char ch : value) if (ch != '\r') clean += ch;
    const auto b = clean.find_first_not_of(" \t\n");
    clean = b == std::string::npos ? "" : clean.substr(b, clean.find_last_not_of(" \t\n") - b + 1);

    auto db = drogon::app().getDbClient();
    if (clean.empty()) {
        // Empty = remove it; the page shows its placeholder again.
        db->execSqlAsync("DELETE FROM site_settings WHERE key = $1",
                         [cb](const Result&) { sendOk(cb); }, dbError(cb), key);
        return;
    }
    const std::string problem = checkBlock(block->kind, clean);
    if (!problem.empty()) {
        Json::Value f;
        f["value"] = problem;
        cb(Http::fieldErrors(f));
        return;
    }
    db->execSqlAsync(
        "INSERT INTO site_settings (key, value) VALUES ($1, $2) "
        "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [cb](const Result&) { sendOk(cb); }, dbError(cb), key, clean);
}

// ---------------------------------------------------------------------------
// Classes
// ---------------------------------------------------------------------------
void EditController::listClasses(const Req&, Callback&& cb) {
    jsonQuery(
        "SELECT json_agg(t ORDER BY t.sort_at DESC) FROM ("
        "  SELECT c.id, c.course, " LOCAL_OUT("c.starts_at") " AS starts_at, " LOCAL_OUT("c.ends_at") " AS ends_at,"
        "         c.location, c.capacity, c.is_open, c.starts_at < NOW() AS past,"
        "         COUNT(r.id)::int AS registered, c.starts_at AS sort_at"
        "  FROM classes c LEFT JOIN class_registrations r ON r.class_id = c.id"
        "  GROUP BY c.id"
        ") t",
        cb);
}

void EditController::createClass(const Req& req, Callback&& cb) {
    const auto* j = body(req, cb);
    if (!j) return;
    ClassInput c;
    Json::Value errors(Json::objectValue);
    if (!readClass(*j, c, errors)) { cb(Http::fieldErrors(errors)); return; }
    writeOne(
        "INSERT INTO classes (course, starts_at, ends_at, location, capacity, is_open) "
        "VALUES ($1, " LOCAL_IN(2) ", " LOCAL_IN(3) ", $4, $5, $6) RETURNING id",
        cb, c.course, c.starts, c.ends, c.location, c.capacity, c.isOpen);
}

void EditController::updateClass(const Req& req, Callback&& cb, int id) {
    const auto* j = body(req, cb);
    if (!j) return;
    ClassInput c;
    Json::Value errors(Json::objectValue);
    if (!readClass(*j, c, errors)) { cb(Http::fieldErrors(errors)); return; }
    writeOne(
        "UPDATE classes SET course = $1, starts_at = " LOCAL_IN(2) ", ends_at = " LOCAL_IN(3) ","
        " location = $4, capacity = $5, is_open = $6 WHERE id = $7 RETURNING id",
        cb, c.course, c.starts, c.ends, c.location, c.capacity, c.isOpen, id);
}

void EditController::deleteClass(const Req&, Callback&& cb, int id) {
    // Registrations for the class are deleted with it (ON DELETE CASCADE).
    writeOne("DELETE FROM classes WHERE id = $1 RETURNING id", cb, id);
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
void EditController::listEvents(const Req&, Callback&& cb) {
    jsonQuery(
        "SELECT json_agg(t ORDER BY t.sort_at DESC) FROM ("
        "  SELECT id, title, " LOCAL_OUT("starts_at") " AS starts_at,"
        "         CASE WHEN ends_at IS NULL THEN NULL ELSE " LOCAL_OUT("ends_at") " END AS ends_at,"
        "         location, description, COALESCE(ends_at, starts_at) < NOW() AS past, starts_at AS sort_at"
        "  FROM events"
        ") t",
        cb);
}

void EditController::createEvent(const Req& req, Callback&& cb) {
    const auto* j = body(req, cb);
    if (!j) return;
    EventInput e;
    Json::Value errors(Json::objectValue);
    if (!readEvent(*j, e, errors)) { cb(Http::fieldErrors(errors)); return; }
    writeOne(
        "INSERT INTO events (title, starts_at, ends_at, location, description) "
        "VALUES ($1, " LOCAL_IN(2) ", (NULLIF($3, '')::timestamp AT TIME ZONE " TZ "), NULLIF($4, ''), NULLIF($5, '')) "
        "RETURNING id",
        cb, e.title, e.starts, e.ends, e.location, e.description);
}

void EditController::updateEvent(const Req& req, Callback&& cb, int id) {
    const auto* j = body(req, cb);
    if (!j) return;
    EventInput e;
    Json::Value errors(Json::objectValue);
    if (!readEvent(*j, e, errors)) { cb(Http::fieldErrors(errors)); return; }
    writeOne(
        "UPDATE events SET title = $1, starts_at = " LOCAL_IN(2) ","
        " ends_at = (NULLIF($3, '')::timestamp AT TIME ZONE " TZ "),"
        " location = NULLIF($4, ''), description = NULLIF($5, '') WHERE id = $6 RETURNING id",
        cb, e.title, e.starts, e.ends, e.location, e.description, id);
}

void EditController::deleteEvent(const Req&, Callback&& cb, int id) {
    writeOne("DELETE FROM events WHERE id = $1 RETURNING id", cb, id);
}

// ---------------------------------------------------------------------------
// Impact numbers and naloxone fulfillment
// ---------------------------------------------------------------------------
void EditController::saveImpact(const Req& req, Callback&& cb, std::string key) {
    const auto* j = body(req, cb);
    if (!j) return;
    if (!(*j).isMember("value") || !(*j)["value"].isInt() ||
        (*j)["value"].asInt() < 0 || (*j)["value"].asInt() > 1000000) {
        Json::Value f;
        f["value"] = "Enter a whole number from 0 to 1,000,000.";
        cb(Http::fieldErrors(f));
        return;
    }
    writeOne("UPDATE impact_stats SET value = $1 WHERE key = $2 RETURNING key",
             cb, (*j)["value"].asInt(), key);
}

void EditController::setFulfilled(const Req& req, Callback&& cb, int id) {
    const auto* j = body(req, cb);
    if (!j) return;
    if (!(*j).isMember("fulfilled") || !(*j)["fulfilled"].isBool()) {
        cb(Http::jsonError(drogon::k400BadRequest, "fulfilled must be true or false"));
        return;
    }
    // The database trigger stamps fulfilled_at; the retention job deletes
    // fulfilled requests after NALOXONE_RETENTION_DAYS.
    writeOne("UPDATE naloxone_requests SET fulfilled = $1 WHERE id = $2 RETURNING id",
             cb, (*j)["fulfilled"].asBool(), id);
}
