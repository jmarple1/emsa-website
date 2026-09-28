#include "PublicController.h"
#include "utils/Http.h"
#include <drogon/drogon.h>
#include <set>

// The list endpoints let PostgreSQL build the JSON (json_agg), so timestamps
// come out as ISO 8601 and numbers stay numbers.

namespace {
void jsonQuery(const std::string& sql, const PublicController::Callback& cb) {
    drogon::app().getDbClient()->execSqlAsync(
        sql,
        [cb](const drogon::orm::Result& r) { Http::sendJsonText(r, cb); },
        [cb](const drogon::orm::DrogonDbException&) {
            cb(Http::jsonError(drogon::k500InternalServerError, "Could not load data"));
        });
}
} // namespace

// GET /api/health — also proves the database connection works
void PublicController::health(const drogon::HttpRequestPtr&, Callback&& cb) {
    drogon::app().getDbClient()->execSqlAsync(
        "SELECT 1",
        [cb](const drogon::orm::Result&) {
            Json::Value body;
            body["status"] = "ok";
            body["db"]     = "ok";
            cb(drogon::HttpResponse::newHttpJsonResponse(body));
        },
        [cb](const drogon::orm::DrogonDbException&) {
            cb(Http::jsonError(drogon::k503ServiceUnavailable, "Database unavailable"));
        });
}

// GET /api/impact — every impact number, in display order
void PublicController::impact(const drogon::HttpRequestPtr&, Callback&& cb) {
    jsonQuery(
        "SELECT json_agg(t ORDER BY t.sort) FROM ("
        "  SELECT key, value, suffix, label, sort FROM impact_stats"
        ") t",
        cb);
}

// GET /api/classes — upcoming open classes with seats left (0 = full)
void PublicController::classes(const drogon::HttpRequestPtr&, Callback&& cb) {
    jsonQuery(
        "SELECT json_agg(t ORDER BY t.starts_at) FROM ("
        "  SELECT c.id, c.course, c.starts_at, c.ends_at, c.location, c.capacity,"
        "         GREATEST(c.capacity - COUNT(r.id), 0)::int AS seats_left"
        "  FROM classes c"
        "  LEFT JOIN class_registrations r ON r.class_id = c.id"
        "  WHERE c.is_open AND c.starts_at > NOW()"
        "  GROUP BY c.id"
        ") t",
        cb);
}

// GET /api/events — upcoming events (including ones happening now)
void PublicController::events(const drogon::HttpRequestPtr&, Callback&& cb) {
    jsonQuery(
        "SELECT json_agg(t ORDER BY t.starts_at) FROM ("
        "  SELECT id, title, starts_at, ends_at, location, description FROM events"
        "  WHERE COALESCE(ends_at, starts_at) >= NOW()"
        "  ORDER BY starts_at LIMIT 100"
        ") t",
        cb);
}

// GET /api/content — every officer-edited text block, {key: value}. Only
// keys listed in utils/ContentBlocks.h can be written, so this is public-safe.
void PublicController::content(const drogon::HttpRequestPtr&, Callback&& cb) {
    drogon::app().getDbClient()->execSqlAsync(
        "SELECT COALESCE(json_object_agg(key, value), '{}'::json) FROM site_settings",
        [cb](const drogon::orm::Result& r) {
            auto resp = drogon::HttpResponse::newHttpResponse();
            resp->setContentTypeCode(drogon::CT_APPLICATION_JSON);
            resp->setBody(r[0][0].as<std::string>());
            cb(resp);
        },
        [cb](const drogon::orm::DrogonDbException&) {
            cb(Http::jsonError(drogon::k500InternalServerError, "Could not load data"));
        });
}

// GET /api/settings/next-meeting — {"next_meeting": "..."} or null
void PublicController::nextMeeting(const drogon::HttpRequestPtr&, Callback&& cb) {
    drogon::app().getDbClient()->execSqlAsync(
        "SELECT value FROM site_settings WHERE key = 'next_meeting'",
        [cb](const drogon::orm::Result& r) {
            Json::Value body;
            body["next_meeting"] = (r.empty() || r[0]["value"].as<std::string>().empty())
                                       ? Json::Value()
                                       : Json::Value(r[0]["value"].as<std::string>());
            cb(drogon::HttpResponse::newHttpJsonResponse(body));
        },
        [cb](const drogon::orm::DrogonDbException&) {
            cb(Http::jsonError(drogon::k500InternalServerError, "Could not load data"));
        });
}

// ---------------------------------------------------------------------------
// POST /api/pageview   Body: { "path": "/join" }
// Adds one to today's count for that page. Only the day, the page, and the
// count are stored: no IP, cookie, or browser details (see /privacy).
// ---------------------------------------------------------------------------
void PublicController::pageView(const drogon::HttpRequestPtr& req, Callback&& cb) {
    static const std::set<std::string> PAGES = {
        "/", "/what-we-do", "/join", "/cpr-classes", "/naloxone", "/emergency",
        "/events", "/about", "/faq", "/contact", "/privacy",
    };
    auto j = req->getJsonObject();
    const std::string path = j && j->isObject() ? Http::str(*j, "path") : "";
    auto noContent = [cb] {
        auto resp = drogon::HttpResponse::newHttpResponse();
        resp->setStatusCode(drogon::k204NoContent);
        cb(resp);
    };
    if (!PAGES.count(path)) { noContent(); return; } // ignore anything else
    drogon::app().getDbClient()->execSqlAsync(
        "INSERT INTO page_views (day, path, views) "
        "VALUES ((NOW() AT TIME ZONE 'America/New_York')::date, $1, 1) "
        "ON CONFLICT (day, path) DO UPDATE SET views = page_views.views + 1",
        [noContent](const drogon::orm::Result&) { noContent(); },
        [noContent](const drogon::orm::DrogonDbException&) { noContent(); },
        path);
}
