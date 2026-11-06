-- Thin entity views over v_rows for the Roofr snapshot. ${PROJECT} and ${DS} are substituted by
-- scripts/snapshot-load.ts. Column extraction is the cleaning work done afterwards.

CREATE OR REPLACE VIEW `${PROJECT}.${DS}.v_jobs` AS
SELECT JSON_VALUE(payload, '$.id') AS id, payload_json, payload, fetched_at
FROM `${PROJECT}.${DS}.v_rows`
WHERE endpoint_id = 'jobs' AND record_index >= 0;

CREATE OR REPLACE VIEW `${PROJECT}.${DS}.v_contacts` AS
SELECT JSON_VALUE(payload, '$.id') AS id, payload_json, payload, fetched_at
FROM `${PROJECT}.${DS}.v_rows`
WHERE endpoint_id = 'contacts' AND record_index >= 0;

CREATE OR REPLACE VIEW `${PROJECT}.${DS}.v_proposals` AS
SELECT JSON_VALUE(payload, '$.id') AS id, payload_json, payload, fetched_at
FROM `${PROJECT}.${DS}.v_rows`
WHERE endpoint_id = 'proposals' AND record_index >= 0;
