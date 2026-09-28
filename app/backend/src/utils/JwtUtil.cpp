#include "JwtUtil.h"
#include <jwt-cpp/jwt.h>
#include <cstdlib>
#include <chrono>
#include <trantor/utils/Logger.h>

namespace {
    constexpr const char* ISSUER = "emsa-backend";
    constexpr auto TOKEN_LIFETIME = std::chrono::hours{2};

    std::string jwtSecret() {
        const char* s = std::getenv("JWT_SECRET");
        if (!s || std::string(s).empty()) {
            // No safe fallback: a hardcoded secret would let anyone forge
            // officer tokens. main.cpp validates this at startup.
            LOG_FATAL << "JWT_SECRET is not set. Refusing to sign/verify tokens.";
            std::abort();
        }
        return s;
    }
}

namespace JwtUtil {

std::string createToken(const std::string& email) {
    auto now = std::chrono::system_clock::now();
    return jwt::create()
        .set_issuer(ISSUER)
        .set_type("JWT")
        .set_subject(email)
        .set_issued_at(now)
        .set_expires_at(now + TOKEN_LIFETIME)
        .sign(jwt::algorithm::hs256{jwtSecret()});
}

bool verifyToken(const std::string& token) {
    return !subject(token).empty();
}

std::string subject(const std::string& token) {
    try {
        auto decoded = jwt::decode(token);
        jwt::verify()
            .allow_algorithm(jwt::algorithm::hs256{jwtSecret()})
            .with_issuer(ISSUER)
            .verify(decoded);
        return decoded.get_subject();
    } catch (...) {
        return "";
    }
}

} // namespace JwtUtil
