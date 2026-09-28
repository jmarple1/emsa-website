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

// ---------------------------------------------------------------------------
// POST /api/admin/password   (signed-in officer)
// Body: { "current": "...", "password": "..." }
// Changes the signed-in officer's own password. The current password is
// required, so a stolen, still-valid token alone can't take over the account.
// ---------------------------------------------------------------------------
void AuthController::changePassword(const drogon::HttpRequestPtr& req,
                                    std::function<void(const drogon::HttpResponsePtr&)>&& callback) {
    auto jsonPtr = req->getJsonObject();
    if (!jsonPtr || !jsonPtr->isObject()) {
        callback(Http::jsonError(drogon::k400BadRequest, "Invalid JSON body"));
        return;
    }
    auto text = [&](const char* k) {
        return (*jsonPtr).isMember(k) && (*jsonPtr)[k].isString() ? (*jsonPtr)[k].asString() : std::string();
    };
    const std::string current = text("current"), password = text("password");
    const std::string officer = req->attributes()->get<std::string>("officer");

    Json::Value errors(Json::objectValue);
    if (current.empty()) errors["current"] = "Enter your current password.";
    if (password.size() < 12) errors["password"] = "Use at least 12 characters.";
    else if (password.size() > 200) errors["password"] = "Use 200 characters or fewer.";
    else if (password == current) errors["password"] = "Choose a password you haven't been using.";
    if (!errors.empty()) {
        callback(Http::fieldErrors(errors));
        return;
    }

    drogon::app().getDbClient()->execSqlAsync(
        "UPDATE officers SET password_hash = crypt($3, gen_salt('bf', 12)) "
        "WHERE lower(email) = lower($1) AND password_hash = crypt($2, password_hash) "
        "RETURNING id",
        [callback](const drogon::orm::Result& r) {
            if (r.empty()) {
                Json::Value f;
                f["current"] = "That isn't your current password.";
                callback(Http::fieldErrors(f));
                return;
            }
            Json::Value ok;
            ok["ok"] = true;
            callback(drogon::HttpResponse::newHttpJsonResponse(ok));
        },
        [callback](const drogon::orm::DrogonDbException&) {
            callback(Http::jsonError(drogon::k500InternalServerError, "Could not change the password"));
        },
        officer, current, password);
}
