#include "AuthController.h"
#include "utils/Http.h"
#include "utils/JwtUtil.h"
#include <drogon/drogon.h>

// ---------------------------------------------------------------------------
// POST /api/auth/login
// Body: { "email": "...", "password": "..." }
// Returns: { "token": "<jwt>", "name": "...", "email": "..." }
//
// Password check runs in PostgreSQL with pgcrypto's crypt(), same as
// KnottSoDirtyCo: crypt($2, password_hash) equals the hash only if correct.
// ---------------------------------------------------------------------------
void AuthController::login(const drogon::HttpRequestPtr& req,
                           std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto jsonPtr = req->getJsonObject();
    if (!jsonPtr || !jsonPtr->isObject()) {
        callback(Http::jsonError(drogon::k400BadRequest, "Invalid JSON body"));
        return;
    }
    const std::string email = Http::str(*jsonPtr, "email");
    const std::string password =
        jsonPtr->isMember("password") && (*jsonPtr)["password"].isString()
            ? (*jsonPtr)["password"].asString() : "";

    if (email.empty() || password.empty()) {
        callback(Http::jsonError(drogon::k400BadRequest, "Email and password are required"));
        return;
    }
    if (email.size() > 254 || password.size() > 1024) {
        callback(Http::jsonError(drogon::k400BadRequest, "Input exceeds allowed length"));
        return;
    }

    drogon::app().getDbClient()->execSqlAsync(
        "SELECT email, name FROM officers "
        "WHERE lower(email) = lower($1) AND password_hash = crypt($2, password_hash)",
        [callback](const drogon::orm::Result& r) {
            if (r.empty()) {
                // Same message for unknown email and wrong password.
                callback(Http::jsonError(drogon::k401Unauthorized, "Invalid email or password"));
                return;
            }
            Json::Value body;
            body["email"] = r[0]["email"].as<std::string>();
            body["name"]  = r[0]["name"].as<std::string>();
            body["token"] = JwtUtil::createToken(body["email"].asString());
            callback(drogon::HttpResponse::newHttpJsonResponse(body));
        },
        [callback](const drogon::orm::DrogonDbException&) {
            callback(Http::jsonError(drogon::k500InternalServerError, "Authentication failed"));
        },
        email, password);
}
