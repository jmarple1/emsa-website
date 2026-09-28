#include "ClassController.h"
#include "utils/Http.h"
#include <drogon/drogon.h>
#include <memory>

using drogon::orm::DrogonDbException;
using drogon::orm::Result;
using drogon::orm::Transaction;
using Callback = std::function<void(const drogon::HttpResponsePtr&)>;

namespace {
Callback onceOnly(Callback cb) {
    auto shared = std::make_shared<Callback>(std::move(cb));
    return [shared](const drogon::HttpResponsePtr& resp) {
        if (*shared) {
            (*shared)(resp);
            *shared = nullptr;
        }
    };
}

drogon::HttpResponsePtr dbFailed() {
    return Http::jsonError(drogon::k500InternalServerError,
                           "Something went wrong saving your registration. Please try again.");
}
} // namespace

// ---------------------------------------------------------------------------
// POST /api/classes/{id}/register
// Body: { name, miami_email }
//
// Capacity is enforced inside one transaction: the class row is locked
// (SELECT ... FOR UPDATE), so two people can't both take the last seat.
// ---------------------------------------------------------------------------
void ClassController::registerForClass(const drogon::HttpRequestPtr& req,
                                       Callback&& callback, int classId) {
    auto jsonPtr = req->getJsonObject();
    if (!jsonPtr || !jsonPtr->isObject()) {
        callback(Http::jsonError(drogon::k400BadRequest, "Invalid JSON body"));
        return;
    }
    const std::string name  = Http::str(*jsonPtr, "name");
    const std::string email = Http::str(*jsonPtr, "miami_email");

    Json::Value errors(Json::objectValue);
    if (name.empty() || name.size() > 200)
        errors["name"] = "Enter your name.";
    if (!Http::isMiamiEmail(email))
        errors["miami_email"] = "Enter your Miami email (ending in @miamioh.edu).";
    if (!errors.empty()) {
        callback(Http::fieldErrors(errors));
        return;
    }

    // Transaction errors can fire more than once; answer the client once.
    auto cb = onceOnly(std::move(callback));

    drogon::app().getDbClient()->newTransactionAsync(
        [cb, classId, name, email](const std::shared_ptr<Transaction>& trans) {
            if (!trans) { cb(dbFailed()); return; }

            trans->execSqlAsync(
                "SELECT capacity, is_open AND starts_at > NOW() AS open "
                "FROM classes WHERE id = $1 FOR UPDATE",
                [cb, trans, classId, name, email](const Result& r) {
                    if (r.empty()) {
                        trans->rollback();
                        cb(Http::jsonError(drogon::k404NotFound, "That class doesn't exist."));
                        return;
                    }
                    if (!r[0]["open"].as<bool>()) {
                        trans->rollback();
                        cb(Http::jsonError(drogon::k409Conflict,
                                           "Registration for this class is closed."));
                        return;
                    }
                    const int capacity = r[0]["capacity"].as<int>();

                    trans->execSqlAsync(
                        "SELECT COUNT(*)::int AS n FROM class_registrations WHERE class_id = $1",
                        [cb, trans, classId, capacity, name, email](const Result& c) {
                            if (c[0]["n"].as<int>() >= capacity) {
                                trans->rollback();
                                cb(Http::jsonError(drogon::k409Conflict, "This class is full."));
                                return;
                            }
                            // ON CONFLICT: the unique (class_id, lower(email))
                            // index rejects a second registration quietly.
                            trans->execSqlAsync(
                                "INSERT INTO class_registrations (class_id, name, miami_email) "
                                "VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING id",
                                [cb](const Result& ins) {
                                    if (ins.empty()) {
                                        Json::Value f;
                                        f["miami_email"] =
                                            "This email is already registered for this class.";
                                        auto resp = Http::fieldErrors(f);
                                        resp->setStatusCode(drogon::k409Conflict);
                                        cb(resp);
                                        return;
                                    }
                                    cb(Http::created("You're registered. See you in class!"));
                                },
                                [cb](const DrogonDbException&) { cb(dbFailed()); },
                                classId, name, email);
                        },
                        [cb](const DrogonDbException&) { cb(dbFailed()); },
                        classId);
                },
                [cb](const DrogonDbException&) { cb(dbFailed()); },
                classId);
        });
}
