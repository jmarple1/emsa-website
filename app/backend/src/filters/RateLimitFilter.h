#pragma once
#include <drogon/HttpFilter.h>
#include <string>

// Sliding-window rate limits kept in memory only (never written to disk or
// the database, and forgotten after the window passes).
namespace RateLimitState {
    bool check(const std::string& key, int maxReqs, int windowSecs);
}

// Public form endpoints: 10 requests / 60 s per IP
class RateLimitFilter : public drogon::HttpFilter<RateLimitFilter> {
public:
    void doFilter(const drogon::HttpRequestPtr&,
                  drogon::FilterCallback&&,
                  drogon::FilterChainCallback&&) override;
};

// Naloxone form: same limit, but keyed on a salted in-memory hash of the IP
// so the address itself is never kept, even in RAM (brief §11 privacy).
class NaloxoneRateLimitFilter : public drogon::HttpFilter<NaloxoneRateLimitFilter> {
public:
    void doFilter(const drogon::HttpRequestPtr&,
                  drogon::FilterCallback&&,
                  drogon::FilterChainCallback&&) override;
};

// Officer login: 5 requests / 60 s per IP
class LoginRateLimitFilter : public drogon::HttpFilter<LoginRateLimitFilter> {
public:
    void doFilter(const drogon::HttpRequestPtr&,
                  drogon::FilterCallback&&,
                  drogon::FilterChainCallback&&) override;
};
