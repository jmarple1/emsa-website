#include "NaloxoneController.h"
#include "utils/Http.h"
#include <drogon/drogon.h>
#include <set>

// ---------------------------------------------------------------------------
// POST /api/naloxone-requests
// Body: { requesting_for: "self"|"chapter_house", chapter_house?,
//         items: ["naloxone","test_strips","condoms","educational_materials"],
//         pickup: "distribution_night"|"arranged", contact_method? }
// ---------------------------------------------------------------------------
void NaloxoneController::submit(const drogon::HttpRequestPtr& req,
                                std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto jsonPtr = req->getJsonObject();
    if (!jsonPtr || !jsonPtr->isObject()) {
        callback(Http::jsonError(drogon::k400BadRequest, "Invalid JSON body"));
        return;
    }
    const auto& j = *jsonPtr;

    // Supplies named on naloxone.html. Must match the Angular form.
    static const std::set<std::string> ITEMS = {
        "naloxone", "test_strips", "condoms", "educational_materials"};

    const std::string requestingFor = Http::str(j, "requesting_for");
    const std::string pickup        = Http::str(j, "pickup");
    std::string chapterHouse        = Http::str(j, "chapter_house");
    std::string contactMethod       = Http::str(j, "contact_method");

    Json::Value errors(Json::objectValue);

    if (requestingFor != "self" && requestingFor != "chapter_house")
        errors["requesting_for"] = "Choose who this request is for.";
    if (requestingFor == "chapter_house") {
        if (chapterHouse.empty() || chapterHouse.size() > 200)
            errors["chapter_house"] = "Enter your chapter house.";
    } else {
        chapterHouse.clear();   // never keep a house name on a personal request
    }

    std::set<std::string> items;
    if (j.isMember("items") && j["items"].isArray()) {
        for (const auto& v : j["items"]) {
            if (!v.isString() || !ITEMS.count(v.asString())) { items.clear(); break; }
            items.insert(v.asString());
        }
    }
    if (items.empty())
        errors["items"] = "Choose at least one item.";

    if (pickup != "distribution_night" && pickup != "arranged")
        errors["pickup"] = "Choose how you'd like to get it.";
    if (pickup == "arranged") {
        if (contactMethod.empty() || contactMethod.size() > 300)
            errors["contact_method"] = "Tell us how to reach you to arrange pickup.";
    } else {
        contactMethod.clear();
    }

    if (!errors.empty()) {
        callback(Http::fieldErrors(errors));
        return;
    }

    // Items are from a fixed whitelist, so a plain PostgreSQL array literal is safe.
    std::string itemsArr = "{";
    for (const auto& it : items) itemsArr += (itemsArr.size() > 1 ? "," : "") + it;
    itemsArr += "}";

    drogon::app().getDbClient()->execSqlAsync(
        "INSERT INTO naloxone_requests (requesting_for, chapter_house, items, pickup, contact_method) "
        "VALUES ($1, NULLIF($2, ''), $3::text[], $4, NULLIF($5, ''))",
        [callback](const drogon::orm::Result&) {
            callback(Http::created("Thanks. Your request was received."));
        },
        [callback](const drogon::orm::DrogonDbException&) {
            callback(Http::jsonError(drogon::k500InternalServerError,
                                     "Something went wrong saving your request. Please try again."));
        },
        requestingFor, chapterHouse, itemsArr, pickup, contactMethod);
}
