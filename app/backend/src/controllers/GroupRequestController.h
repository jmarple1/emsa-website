#pragma once
#include <drogon/HttpController.h>

class GroupRequestController : public drogon::HttpController<GroupRequestController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(GroupRequestController::submit, "/api/group-class-requests",
                  drogon::Post, "RateLimitFilter");
    METHOD_LIST_END

    void submit(const drogon::HttpRequestPtr& req,
                std::function<void(const drogon::HttpResponsePtr&)>&& callback);
};
