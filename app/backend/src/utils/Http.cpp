#include "Http.h"
#include <regex>
#include <sstream>

namespace Http {

drogon::HttpResponsePtr jsonError(drogon::HttpStatusCode code, const std::string& msg) {
    Json::Value body;
    body["error"] = msg;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(body);
    resp->setStatusCode(code);
    return resp;
}

drogon::HttpResponsePtr fieldErrors(const Json::Value& fields) {
    Json::Value body;
    body["error"]  = "Please fix the highlighted fields.";
    body["fields"] = fields;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(body);
    resp->setStatusCode(drogon::k400BadRequest);
    return resp;
}

drogon::HttpResponsePtr created(const std::string& message) {
    Json::Value body;
    body["ok"]      = true;
    body["message"] = message;
    auto resp = drogon::HttpResponse::newHttpJsonResponse(body);
    resp->setStatusCode(drogon::k201Created);
    return resp;
}

std::string str(const Json::Value& j, const char* key) {
    if (!j.isObject() || !j.isMember(key) || !j[key].isString()) return "";
    const std::string s = j[key].asString();
    const auto b = s.find_first_not_of(" \t\r\n");
    if (b == std::string::npos) return "";
    const auto e = s.find_last_not_of(" \t\r\n");
    return s.substr(b, e - b + 1);
}

bool isEmail(const std::string& s) {
    static const std::regex re(R"(^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$)");
    return s.size() <= 254 && std::regex_match(s, re);
}

bool isMiamiEmail(const std::string& s) {
    static const std::regex re(R"(^[A-Za-z0-9._%+\-]+@miamioh\.edu$)", std::regex::icase);
    return s.size() <= 254 && std::regex_match(s, re);
}

std::string clientIp(const drogon::HttpRequestPtr& req) {
    const auto& real = req->getHeader("X-Real-IP");
    return real.empty() ? req->getPeerAddr().toIp() : real;
}

void sendJsonText(const drogon::orm::Result& r, const Callback& cb) {
    auto resp = drogon::HttpResponse::newHttpResponse();
    resp->setContentTypeCode(drogon::CT_APPLICATION_JSON);
    resp->setBody(r.empty() || r[0][0].isNull() ? "[]" : r[0][0].as<std::string>());
    cb(resp);
}

Json::Value resultToTable(const drogon::orm::Result& r) {
    Json::Value out;
    out["columns"] = Json::arrayValue;
    out["rows"]    = Json::arrayValue;
    const auto cols = r.columns();
    for (drogon::orm::Row::SizeType c = 0; c < cols; ++c)
        out["columns"].append(r.columnName(c));
    for (const auto& row : r) {
        Json::Value obj(Json::objectValue);
        for (drogon::orm::Row::SizeType c = 0; c < cols; ++c) {
            const std::string name = r.columnName(c);
            obj[name] = row[c].isNull() ? Json::Value() : Json::Value(row[c].as<std::string>());
        }
        out["rows"].append(obj);
    }
    return out;
}

namespace {
std::string csvCell(std::string v) {
    // A cell starting with = + - @ tab or CR can run as a formula in Excel or
    // Sheets. Prefix a quote so it is shown as text.
    if (!v.empty() && std::string("=+-@\t\r").find(v[0]) != std::string::npos)
        v.insert(v.begin(), '\'');
    std::string out = "\"";
    for (char ch : v) {
        if (ch == '"') out += '"';
        out += ch;
    }
    return out + "\"";
}
} // namespace

std::string resultToCsv(const drogon::orm::Result& r) {
    std::ostringstream out;
    const auto cols = r.columns();
    for (drogon::orm::Row::SizeType c = 0; c < cols; ++c)
        out << (c ? "," : "") << csvCell(r.columnName(c));
    out << "\r\n";
    for (const auto& row : r) {
        for (drogon::orm::Row::SizeType c = 0; c < cols; ++c)
            out << (c ? "," : "") << csvCell(row[c].isNull() ? "" : row[c].as<std::string>());
        out << "\r\n";
    }
    return out.str();
}

} // namespace Http
