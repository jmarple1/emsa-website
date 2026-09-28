#pragma once
#include <drogon/HttpController.h>

class ClassController : public drogon::HttpController<ClassController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(ClassController::registerForClass, "/api/classes/{1}/register",
                  drogon::Post, "RateLimitFilter");
    METHOD_LIST_END

    void registerForClass(const drogon::HttpRequestPtr& req,
                          std::function<void(const drogon::HttpResponsePtr&)>&& callback,
                          int classId);
};
