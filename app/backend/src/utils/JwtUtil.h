#pragma once
#include <string>

namespace JwtUtil {

// Create a signed HS-256 JWT for the given officer email (2-hour expiry).
// Reads JWT_SECRET from the environment; main.cpp refuses to start without it.
std::string createToken(const std::string& email);

// Returns true if the token is valid, not expired, and the issuer matches.
bool verifyToken(const std::string& token);

} // namespace JwtUtil
