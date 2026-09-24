#pragma once
#include <drogon/HttpController.h>

// Public read-only endpoints.
class PublicController : public drogon::HttpController<PublicController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(PublicController::health,      "/api/health",                drogon::Get);
    ADD_METHOD_TO(PublicController::impact,      "/api/impact",                drogon::Get);
    ADD_METHOD_TO(PublicController::classes,     "/api/classes",               drogon::Get);
    ADD_METHOD_TO(PublicController::events,      "/api/events",                drogon::Get);
    ADD_METHOD_TO(PublicController::nextMeeting, "/api/settings/next-meeting", drogon::Get);
    ADD_METHOD_TO(PublicController::content,     "/api/content",               drogon::Get);
    METHOD_LIST_END

    using Callback = std::function<void(const drogon::HttpResponsePtr&)>;

    void health(const drogon::HttpRequestPtr&, Callback&&);
    void impact(const drogon::HttpRequestPtr&, Callback&&);
    void classes(const drogon::HttpRequestPtr&, Callback&&);
    void events(const drogon::HttpRequestPtr&, Callback&&);
    void nextMeeting(const drogon::HttpRequestPtr&, Callback&&);
    void content(const drogon::HttpRequestPtr&, Callback&&);
};
