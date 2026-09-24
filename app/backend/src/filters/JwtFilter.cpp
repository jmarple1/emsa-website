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
    const std::string officer = JwtUtil::subject(auth.substr(7));
    if (officer.empty()) {
        fcb(Http::jsonError(drogon::k401Unauthorized, "Invalid or expired token"));
        return;
    }
    req->attributes()->insert("officer", officer); // who is signed in
    fccb(); // token valid — proceed to controller
}
