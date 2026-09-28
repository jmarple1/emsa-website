#include "RateLimitFilter.h"
#include "utils/Http.h"
#include <chrono>
#include <deque>
#include <functional>
#include <mutex>
#include <random>
#include <unordered_map>

namespace RateLimitState {
namespace {
    using Clock = std::chrono::steady_clock;
    std::mutex mtx;
    std::unordered_map<std::string, std::deque<Clock::time_point>> windows;
    unsigned calls = 0;
}

bool check(const std::string& key, int maxReqs, int windowSecs) {
    const auto now    = Clock::now();
    const auto cutoff = now - std::chrono::seconds(windowSecs);

    std::lock_guard<std::mutex> lock(mtx);

    // Every 256 calls, drop keys with no recent requests so the map does not
    // grow forever (and stale keys are not kept around).
    if (++calls % 256 == 0) {
        for (auto it = windows.begin(); it != windows.end();) {
            if (it->second.empty() || it->second.back() < cutoff) it = windows.erase(it);
            else ++it;
        }
    }

    auto& q = windows[key];
    while (!q.empty() && q.front() < cutoff) q.pop_front();
    if (static_cast<int>(q.size()) >= maxReqs) return false;
    q.push_back(now);
    return true;
}
} // namespace RateLimitState

namespace {
drogon::HttpResponsePtr tooManyRequests() {
    auto resp = Http::jsonError(static_cast<drogon::HttpStatusCode>(429),
                                "Too many requests. Please wait a minute and try again.");
    resp->addHeader("Retry-After", "60");
    return resp;
}

void limit(const std::string& key, int maxReqs,
           drogon::FilterCallback& fcb, drogon::FilterChainCallback& fccb) {
    if (RateLimitState::check(key, maxReqs, 60)) fccb();
    else fcb(tooManyRequests());
}

// Random per-process salt: hashes cannot be matched across restarts.
const std::string& salt() {
    static const std::string s = std::to_string(std::random_device{}()) +
                                 std::to_string(std::random_device{}());
    return s;
}
} // namespace

// Campus Wi-Fi puts many students behind one public IP, and a tabling QR
// code can bring dozens of sign-ups a minute from that one address, so the
// form limit is generous and counted separately for each form.
constexpr int FORM_LIMIT = 30;

void RateLimitFilter::doFilter(const drogon::HttpRequestPtr& req,
                               drogon::FilterCallback&& fcb,
                               drogon::FilterChainCallback&& fccb) {
    limit("form:" + req->path() + ":" + Http::clientIp(req), FORM_LIMIT, fcb, fccb);
}

void NaloxoneRateLimitFilter::doFilter(const drogon::HttpRequestPtr& req,
                                       drogon::FilterCallback&& fcb,
                                       drogon::FilterChainCallback&& fccb) {
    const auto h = std::hash<std::string>{}(salt() + Http::clientIp(req));
    limit("nal:" + std::to_string(h), FORM_LIMIT, fcb, fccb);
}

void LoginRateLimitFilter::doFilter(const drogon::HttpRequestPtr& req,
                                    drogon::FilterCallback&& fcb,
                                    drogon::FilterChainCallback&& fccb) {
    // Tighter than the form limiter to slow down password guessing.
    limit("login:" + Http::clientIp(req), 5, fcb, fccb);
}

void PageViewRateLimitFilter::doFilter(const drogon::HttpRequestPtr& req,
                                       drogon::FilterCallback&& fcb,
                                       drogon::FilterChainCallback&& fccb) {
    const auto h = std::hash<std::string>{}(salt() + Http::clientIp(req));
    limit("pv:" + std::to_string(h), FORM_LIMIT, fcb, fccb);
}
