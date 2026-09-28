#pragma once
#include <drogon/drogon.h>
#include <json/json.h>
#include <functional>
#include <string>
#include <vector>

// Shared helpers for controllers: JSON errors, field validation, reading
// query results as JSON, CSV export.
namespace Http {

using Callback = std::function<void(const drogon::HttpResponsePtr&)>;

drogon::HttpResponsePtr jsonError(drogon::HttpStatusCode code, const std::string& msg);

// 400 with {"error": ..., "fields": {field: message}} so the form can show
// each message next to its field.
drogon::HttpResponsePtr fieldErrors(const Json::Value& fields);

drogon::HttpResponsePtr created(const std::string& message);

// Trimmed string value of j[key]; "" if missing or not a string.
std::string str(const Json::Value& j, const char* key);

bool isEmail(const std::string& s);
bool isMiamiEmail(const std::string& s);   // ends with @miamioh.edu

// Client IP for rate limiting. Uses X-Real-IP set by our nginx (the backend
// is never exposed directly), falling back to the socket peer.
std::string clientIp(const drogon::HttpRequestPtr& req);

// Wraps a query whose single column is a JSON document (e.g. from
// json_agg) and sends it as the response body.
void sendJsonText(const drogon::orm::Result& r, const Callback& cb);

// Converts a result to {"columns": [...], "rows": [{col: "text"|null}]}.
Json::Value resultToTable(const drogon::orm::Result& r);

// Converts a result to CSV text, with spreadsheet formula injection guarded.
std::string resultToCsv(const drogon::orm::Result& r);

} // namespace Http
