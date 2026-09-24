#pragma once
#include <drogon/HttpController.h>

// Officer-only, read-only views of form submissions (phase 1).
// Add ?format=csv to any of these to download a spreadsheet.
class AdminController : public drogon::HttpController<AdminController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(AdminController::join,          "/api/admin/join",           drogon::Get, "JwtFilter");
    ADD_METHOD_TO(AdminController::registrations, "/api/admin/registrations",  drogon::Get, "JwtFilter");
    ADD_METHOD_TO(AdminController::groupRequests, "/api/admin/group-requests", drogon::Get, "JwtFilter");
    ADD_METHOD_TO(AdminController::naloxone,      "/api/admin/naloxone",       drogon::Get, "JwtFilter");
    ADD_METHOD_TO(AdminController::pageViews,     "/api/admin/page-views",     drogon::Get, "JwtFilter");
    METHOD_LIST_END

    using Callback = std::function<void(const drogon::HttpResponsePtr&)>;

    void join(const drogon::HttpRequestPtr&, Callback&&);
    void registrations(const drogon::HttpRequestPtr&, Callback&&);
    void groupRequests(const drogon::HttpRequestPtr&, Callback&&);
    void naloxone(const drogon::HttpRequestPtr&, Callback&&);
    void pageViews(const drogon::HttpRequestPtr&, Callback&&);
};
