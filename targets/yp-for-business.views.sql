-- Thin entity views over v_rows for the YP for Business snapshot. ${PROJECT} and ${DS} are
-- substituted by scripts/snapshot-load.ts.

CREATE OR REPLACE VIEW `${PROJECT}.${DS}.v_leads` AS
SELECT JSON_VALUE(payload, '$.id') AS id, payload_json, payload, fetched_at
FROM `${PROJECT}.${DS}.v_rows`
WHERE endpoint_id = 'leads' AND record_index >= 0;

CREATE OR REPLACE VIEW `${PROJECT}.${DS}.v_dash_leads` AS
SELECT JSON_VALUE(payload, '$.id') AS id, payload_json, payload, fetched_at
FROM `${PROJECT}.${DS}.v_rows`
WHERE endpoint_id = 'dash-leads' AND record_index >= 0;
