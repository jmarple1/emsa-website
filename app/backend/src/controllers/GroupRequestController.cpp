#include "GroupRequestController.h"
#include "utils/Http.h"
#include <drogon/drogon.h>
#include <set>

// ---------------------------------------------------------------------------
// POST /api/group-class-requests — "Request a class for your group" (brief §5)
// Body: { group_name, contact_name, contact_email, preferred_dates, course, headcount }
// ---------------------------------------------------------------------------
void GroupRequestController::submit(const drogon::HttpRequestPtr& req,
                                    std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto jsonPtr = req->getJsonObject();
    if (!jsonPtr || !jsonPtr->isObject()) {
        callback(Http::jsonError(drogon::k400BadRequest, "Invalid JSON body"));
        return;
    }
    const auto& j = *jsonPtr;

    static const std::set<std::string> COURSES = {"BLS", "Heartsaver", "Stop the Bleed"};

    const std::string groupName   = Http::str(j, "group_name");
    const std::string contactName = Http::str(j, "contact_name");
    const std::string email       = Http::str(j, "contact_email");
    const std::string dates       = Http::str(j, "preferred_dates");
    const std::string course      = Http::str(j, "course");

    int headcount = 0;
    if (j.isMember("headcount") && j["headcount"].isInt()) headcount = j["headcount"].asInt();

    Json::Value errors(Json::objectValue);
    if (groupName.empty() || groupName.size() > 200)
        errors["group_name"] = "Enter your group's name.";
    if (contactName.empty() || contactName.size() > 200)
        errors["contact_name"] = "Enter a contact name.";
    if (!Http::isEmail(email))
        errors["contact_email"] = "Enter a valid email address.";
    if (dates.empty() || dates.size() > 1000)
        errors["preferred_dates"] = "Tell us which dates work for your group.";
    if (!COURSES.count(course))
        errors["course"] = "Choose a course.";
    if (headcount < 1 || headcount > 1000)
        errors["headcount"] = "Enter how many people (1 to 1,000).";
    if (!errors.empty()) {
        callback(Http::fieldErrors(errors));
        return;
    }

    drogon::app().getDbClient()->execSqlAsync(
        "INSERT INTO group_class_requests "
        "  (group_name, contact_name, contact_email, preferred_dates, course, headcount) "
        "VALUES ($1, $2, $3, $4, $5, $6)",
        [callback](const drogon::orm::Result&) {
            callback(Http::created("Thanks! An EMSA officer will contact you about scheduling."));
        },
        [callback](const drogon::orm::DrogonDbException&) {
            callback(Http::jsonError(drogon::k500InternalServerError,
                                     "Something went wrong saving your request. Please try again."));
        },
        groupName, contactName, email, dates, course, headcount);
}
