#include "JoinController.h"
#include "utils/Http.h"
#include <drogon/drogon.h>
#include <set>

// ---------------------------------------------------------------------------
// POST /api/join — interest form (brief §6 fields exactly)
// Body: { name, miami_email, year, major, emt_certified: bool, heard_from }
// ---------------------------------------------------------------------------
void JoinController::submit(const drogon::HttpRequestPtr& req,
                            std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto jsonPtr = req->getJsonObject();
    if (!jsonPtr || !jsonPtr->isObject()) {
        callback(Http::jsonError(drogon::k400BadRequest, "Invalid JSON body"));
        return;
    }
    const auto& j = *jsonPtr;

    // Must match the options in the Angular join form.
    static const std::set<std::string> YEARS = {
        "First-year", "Sophomore", "Junior", "Senior", "Graduate student", "Other"};

    const std::string name      = Http::str(j, "name");
    const std::string email     = Http::str(j, "miami_email");
    const std::string year      = Http::str(j, "year");
    const std::string major     = Http::str(j, "major");
    const std::string heardFrom = Http::str(j, "heard_from");

    Json::Value errors(Json::objectValue);
    if (name.empty() || name.size() > 200)
        errors["name"] = "Enter your name.";
    if (!Http::isMiamiEmail(email))
        errors["miami_email"] = "Enter your Miami email (ending in @miamioh.edu).";
    if (!YEARS.count(year))
        errors["year"] = "Choose your year.";
    if (major.empty() || major.size() > 200)
        errors["major"] = "Enter your major (or \"Undecided\").";
    if (!j.isMember("emt_certified") || !j["emt_certified"].isBool())
        errors["emt_certified"] = "Tell us whether you're EMT certified.";
    if (heardFrom.size() > 500)
        errors["heard_from"] = "Keep this under 500 characters.";
    if (!errors.empty()) {
        callback(Http::fieldErrors(errors));
        return;
    }

    drogon::app().getDbClient()->execSqlAsync(
        "INSERT INTO join_submissions (name, miami_email, year, major, emt_certified, heard_from) "
        "VALUES ($1, $2, $3, $4, $5, $6)",
        [callback](const drogon::orm::Result&) {
            callback(Http::created("Thanks for your interest in EMS Alliance!"));
        },
        [callback](const drogon::orm::DrogonDbException&) {
            callback(Http::jsonError(drogon::k500InternalServerError,
                                     "Something went wrong saving your form. Please try again."));
        },
        name, email, year, major, j["emt_certified"].asBool(), heardFrom);
}
