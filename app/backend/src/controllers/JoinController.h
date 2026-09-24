#pragma once
#include <drogon/HttpController.h>

class JoinController : public drogon::HttpController<JoinController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(JoinController::submit, "/api/join", drogon::Post, "RateLimitFilter");
    METHOD_LIST_END

    void submit(const drogon::HttpRequestPtr& req,
                std::function<void(const drogon::HttpResponsePtr&)>&& callback);
};
