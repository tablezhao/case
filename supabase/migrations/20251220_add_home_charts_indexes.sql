CREATE INDEX IF NOT EXISTS cases_report_date_idx ON cases (report_date);
CREATE INDEX IF NOT EXISTS cases_department_report_date_idx ON cases (department_id, report_date);
CREATE INDEX IF NOT EXISTS cases_platform_report_date_idx ON cases (platform_id, report_date);
