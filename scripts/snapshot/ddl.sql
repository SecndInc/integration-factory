-- Snapshot landing DDL. ${PROJECT} and ${DS} are substituted by scripts/snapshot-load.ts.
-- The three raw tables are normally created by `bq load --replace` with the matching
-- *.schema.json files; these statements make the script idempotent on a fresh dataset and
-- create the views. No default table expiration is set anywhere.

CREATE TABLE IF NOT EXISTS `${PROJECT}.${DS}.raw_rows` (
  run_id STRING NOT NULL,
  site STRING NOT NULL,
  endpoint_id STRING NOT NULL,
  method STRING,
  path_template STRING,
  url STRING,
  fetched_at TIMESTAMP,
  status INT64,
  page_key STRING,
  record_index INT64,
  payload STRING,
  payload_sha256 STRING
)
CLUSTER BY endpoint_id, page_key;

CREATE TABLE IF NOT EXISTS `${PROJECT}.${DS}.raw_failures` (
  run_id STRING NOT NULL,
  site STRING NOT NULL,
  endpoint_id STRING NOT NULL,
  method STRING,
  path_template STRING,
  url STRING,
  fetched_at TIMESTAMP,
  status INT64,
  page_key STRING,
  record_index INT64,
  payload_sha256 STRING,
  error STRING
);

CREATE TABLE IF NOT EXISTS `${PROJECT}.${DS}.raw_manifest` (
  run_id STRING NOT NULL,
  site STRING NOT NULL,
  endpoint_id STRING NOT NULL,
  state STRING,
  `rows` INT64,
  bytes INT64,
  started TIMESTAMP,
  finished TIMESTAMP,
  run_status STRING
);

-- Deduped on (endpoint_id, page_key, record_index): a resumed run can repeat one page.
-- SAFE.PARSE_JSON keeps envelope lines (raw response text, possibly not JSON) from failing the view.
CREATE OR REPLACE VIEW `${PROJECT}.${DS}.v_rows` AS
SELECT
  * EXCEPT (rn),
  SAFE.PARSE_JSON(payload, wide_number_mode => 'round') AS payload_json
FROM (
  SELECT
    r.*,
    ROW_NUMBER() OVER (
      PARTITION BY endpoint_id, page_key, record_index
      ORDER BY fetched_at DESC
    ) AS rn
  FROM `${PROJECT}.${DS}.raw_rows` AS r
)
WHERE rn = 1;
