#include "JwtFilter.h"
#include "utils/Http.h"
#include "utils/JwtUtil.h"

void JwtFilter::doFilter(const drogon::HttpRequestPtr& req,
                         drogon::FilterCallback&&      fcb,
                         drogon::FilterChainCallback&& fccb) {
    const auto& auth = req->getHeader("Authorization");

    if (auth.size() < 8 || auth.rfind("Bearer ", 0) != 0) {
        fcb(Http::jsonError(drogon::k401Unauthorized, "Missing or malformed Authorization header"));
        return;
    }
    if (!JwtUtil::verifyToken(auth.substr(7))) {
        fcb(Http::jsonError(drogon::k401Unauthorized, "Invalid or expired token"));
        return;
    }
    fccb(); // token valid — proceed to controller
}
