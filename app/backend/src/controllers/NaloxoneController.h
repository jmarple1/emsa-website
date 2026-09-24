#pragma once
#include <drogon/HttpController.h>

// Naloxone / supply requests. Privacy (brief §11): no name, and no IP or
// user agent is stored or logged for this route. nginx also turns its
// access log off for it (frontend/nginx.conf).
class NaloxoneController : public drogon::HttpController<NaloxoneController> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(NaloxoneController::submit, "/api/naloxone-requests",
                  drogon::Post, "NaloxoneRateLimitFilter");
    METHOD_LIST_END

    void submit(const drogon::HttpRequestPtr& req,
                std::function<void(const drogon::HttpResponsePtr&)>&& callback);
};
