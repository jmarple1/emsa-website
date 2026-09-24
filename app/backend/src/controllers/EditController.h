#pragma once
#include <drogon/HttpController.h>

// Officer editing (phase 2): site content blocks, classes, events, impact
// numbers, and marking naloxone requests fulfilled. Every route needs a
// valid officer JWT.
class EditController : public drogon::HttpController<EditController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(EditController::listContent,  "/api/admin/content",       drogon::Get,    "JwtFilter");
    ADD_METHOD_TO(EditController::saveContent,  "/api/admin/content/{1}",   drogon::Put,    "JwtFilter");

    ADD_METHOD_TO(EditController::listClasses,  "/api/admin/classes",       drogon::Get,    "JwtFilter");
    ADD_METHOD_TO(EditController::createClass,  "/api/admin/classes",       drogon::Post,   "JwtFilter");
    ADD_METHOD_TO(EditController::updateClass,  "/api/admin/classes/{1}",   drogon::Put,    "JwtFilter");
    ADD_METHOD_TO(EditController::deleteClass,  "/api/admin/classes/{1}",   drogon::Delete, "JwtFilter");

    ADD_METHOD_TO(EditController::listEvents,   "/api/admin/events",        drogon::Get,    "JwtFilter");
    ADD_METHOD_TO(EditController::createEvent,  "/api/admin/events",        drogon::Post,   "JwtFilter");
    ADD_METHOD_TO(EditController::updateEvent,  "/api/admin/events/{1}",    drogon::Put,    "JwtFilter");
    ADD_METHOD_TO(EditController::deleteEvent,  "/api/admin/events/{1}",    drogon::Delete, "JwtFilter");

    ADD_METHOD_TO(EditController::saveImpact,   "/api/admin/impact/{1}",    drogon::Put,    "JwtFilter");
    ADD_METHOD_TO(EditController::setFulfilled, "/api/admin/naloxone/{1}",  drogon::Patch,  "JwtFilter");
    METHOD_LIST_END

    using Callback = std::function<void(const drogon::HttpResponsePtr&)>;
    using Req = drogon::HttpRequestPtr;

    void listContent(const Req&, Callback&&);
    void saveContent(const Req&, Callback&&, std::string key);

    void listClasses(const Req&, Callback&&);
    void createClass(const Req&, Callback&&);
    void updateClass(const Req&, Callback&&, int id);
    void deleteClass(const Req&, Callback&&, int id);

    void listEvents(const Req&, Callback&&);
    void createEvent(const Req&, Callback&&);
    void updateEvent(const Req&, Callback&&, int id);
    void deleteEvent(const Req&, Callback&&, int id);

    void saveImpact(const Req&, Callback&&, std::string key);
    void setFulfilled(const Req&, Callback&&, int id);
};
