#include <drogon/drogon.h>
#include <cstdlib>
#include <string>
#include <iostream>

// All controllers and filters are auto-registered by Drogon because they are
// compiled into the same binary (METHOD_LIST_BEGIN etc. in their headers).

int main() {
    // -----------------------------------------------------------------------
    // Read configuration from environment variables
    // -----------------------------------------------------------------------
    auto getenv_s = [](const char* key, const char* fallback) -> std::string {
        const char* v = std::getenv(key);
        return v ? std::string(v) : std::string(fallback);
    };

    const std::string dbHost   = getenv_s("DB_HOST",     "localhost");
    const int         dbPort   = std::stoi(getenv_s("DB_PORT", "5432"));
    const std::string dbName   = getenv_s("DB_NAME",     "emsa");
    const std::string dbUser   = getenv_s("DB_USER",     "emsa_user");
    const std::string dbPass   = getenv_s("DB_PASSWORD", "");
    const int         srvPort  = std::stoi(getenv_s("SERVER_PORT", "8080"));
    const int  retentionDays   = std::stoi(getenv_s("NALOXONE_RETENTION_DAYS", "30"));

    // -----------------------------------------------------------------------
    // Refuse to start with a missing or weak JWT signing secret. A default
    // value here would let anyone forge officer tokens.
    // -----------------------------------------------------------------------
    const std::string jwtSecret = getenv_s("JWT_SECRET", "");
    if (jwtSecret.size() < 32) {
        std::cerr << "[fatal] JWT_SECRET is not set or is shorter than 32 "
                     "characters. Set a long, random JWT_SECRET in your "
                     "environment before starting the server." << std::endl;
        return 1;
    }

    // -----------------------------------------------------------------------
    // Naloxone retention: delete fulfilled requests after N days. Runs once
    // shortly after start, then hourly.
    // -----------------------------------------------------------------------
    drogon::app().registerBeginningAdvice([retentionDays] {
        auto purge = [retentionDays] {
            drogon::app().getDbClient()->execSqlAsync(
                "DELETE FROM naloxone_requests "
                "WHERE fulfilled AND fulfilled_at < NOW() - make_interval(days => $1)",
                [](const drogon::orm::Result& r) {
                    if (r.affectedRows() > 0)
                        LOG_INFO << "Retention: deleted " << r.affectedRows()
                                 << " fulfilled naloxone request(s)";
                },
                [](const drogon::orm::DrogonDbException&) {
                    LOG_ERROR << "Retention: naloxone purge failed";
                },
                retentionDays);
        };
        drogon::app().getLoop()->runAfter(5.0, purge);
        drogon::app().getLoop()->runEvery(3600.0, purge);
    });

    // -----------------------------------------------------------------------
    // Configure and run. nginx serves the Angular app and proxies /api here,
    // so everything is same-origin and no CORS headers are needed.
    // -----------------------------------------------------------------------
    drogon::app()
        .addListener("0.0.0.0", srvPort)
        .setThreadNum(4)
        .setLogLevel(trantor::Logger::kInfo)
        .setClientMaxBodySize(64 * 1024)   // forms are tiny; reject big bodies
        .setUploadPath("/tmp/emsa-uploads") // no uploads, but Drogon needs a writable dir
        .createDbClient(
            "postgresql",
            dbHost,
            static_cast<unsigned short>(dbPort),
            dbName,
            dbUser,
            dbPass,
            4,                  // connection pool size
            "",                 // unix socket (empty = TCP)
            "default")          // client name
        .run();

    return 0;
}
