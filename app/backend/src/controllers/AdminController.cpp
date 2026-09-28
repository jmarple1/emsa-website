#include "AdminController.h"
#include "utils/Http.h"
#include <drogon/drogon.h>

// Times are shown in Oxford, Ohio local time for officers.
#define LOCAL_TIME(col) "to_char(" col " AT TIME ZONE 'America/New_York', 'YYYY-MM-DD HH24:MI')"

namespace {
// Runs a query and returns it as {"columns", "rows"} JSON, or as a CSV
// download when the request has ?format=csv.
void table(const drogon::HttpRequestPtr& req, const std::string& sql,
           const std::string& filename, const AdminController::Callback& cb) {
    const bool csv = req->getParameter("format") == "csv";
    drogon::app().getDbClient()->execSqlAsync(
        sql,
        [cb, csv, filename](const drogon::orm::Result& r) {
            if (!csv) {
                cb(drogon::HttpResponse::newHttpJsonResponse(Http::resultToTable(r)));
                return;
            }
            auto resp = drogon::HttpResponse::newHttpResponse();
            resp->setContentTypeString("text/csv; charset=utf-8");
            resp->addHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
            resp->addHeader("Cache-Control", "no-store");
            resp->setBody(Http::resultToCsv(r));
            cb(resp);
        },
        [cb](const drogon::orm::DrogonDbException&) {
            cb(Http::jsonError(drogon::k500InternalServerError, "Could not load data"));
        });
}
} // namespace

void AdminController::join(const drogon::HttpRequestPtr& req, Callback&& cb) {
    table(req,
          "SELECT id, " LOCAL_TIME("created_at") " AS submitted, name, miami_email, year, major,"
          " CASE WHEN emt_certified THEN 'Yes' ELSE 'No' END AS emt_certified, heard_from"
          " FROM join_submissions ORDER BY created_at DESC",
          "emsa-join-submissions.csv", cb);
}

void AdminController::registrations(const drogon::HttpRequestPtr& req, Callback&& cb) {
    table(req,
          "SELECT r.id, " LOCAL_TIME("r.created_at") " AS registered, c.course,"
          " " LOCAL_TIME("c.starts_at") " AS class_starts, c.location, r.name, r.miami_email"
          " FROM class_registrations r JOIN classes c ON c.id = r.class_id"
          " ORDER BY c.starts_at DESC, r.created_at",
          "emsa-class-registrations.csv", cb);
}

void AdminController::groupRequests(const drogon::HttpRequestPtr& req, Callback&& cb) {
    table(req,
          "SELECT id, " LOCAL_TIME("created_at") " AS submitted, group_name, contact_name,"
          " contact_email, preferred_dates, course, headcount"
          " FROM group_class_requests ORDER BY created_at DESC",
          "emsa-group-class-requests.csv", cb);
}

void AdminController::naloxone(const drogon::HttpRequestPtr& req, Callback&& cb) {
    table(req,
          "SELECT id, " LOCAL_TIME("created_at") " AS submitted,"
          " CASE requesting_for WHEN 'self' THEN 'Myself' ELSE 'Chapter house' END AS requesting_for,"
          " chapter_house,"
          " array_to_string(ARRAY(SELECT CASE i WHEN 'naloxone' THEN 'Naloxone'"
          "   WHEN 'test_strips' THEN 'Fentanyl test strips' WHEN 'condoms' THEN 'Condoms'"
          "   WHEN 'educational_materials' THEN 'Educational materials' ELSE i END"
          "   FROM unnest(items) AS i), ', ') AS items,"
          " CASE pickup WHEN 'distribution_night' THEN 'Distribution night' ELSE 'Arranged' END AS pickup,"
          " contact_method, CASE WHEN fulfilled THEN 'Yes' ELSE 'No' END AS fulfilled"
          " FROM naloxone_requests ORDER BY created_at DESC",
          "emsa-naloxone-requests.csv", cb);
}

void AdminController::pageViews(const drogon::HttpRequestPtr& req, Callback&& cb) {
    table(req,
          "SELECT to_char(day, 'YYYY-MM-DD') AS day, path AS page, views"
          " FROM page_views ORDER BY day DESC, views DESC",
          "emsa-page-views.csv", cb);
}
