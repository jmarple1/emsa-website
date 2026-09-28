#pragma once
#include <drogon/HttpFilter.h>

// Protects /api/admin/*: requires "Authorization: Bearer <jwt>".
class JwtFilter : public drogon::HttpFilter<JwtFilter> {
public:
    void doFilter(const drogon::HttpRequestPtr&,
                  drogon::FilterCallback&&,
                  drogon::FilterChainCallback&&) override;
};
