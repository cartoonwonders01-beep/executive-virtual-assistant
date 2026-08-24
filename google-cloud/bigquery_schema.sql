-- ==============================================================================
-- Google BigQuery Schema: Executive AI Assistant Data Warehouse & Vector Search
-- Project: homeassistant-506520
-- Dataset: executive_assistant_hub
-- ==============================================================================

-- 1. Create Dataset (EU Region for European Compliance)
CREATE SCHEMA IF NOT EXISTS `homeassistant-506520.executive_assistant_hub`
OPTIONS (
  location = 'EU',
  description = 'Data Warehouse & Vector RAG Memory for Executive AI Assistant'
);

-- 2. Tasks Ledger Table
CREATE TABLE IF NOT EXISTS `homeassistant-506520.executive_assistant_hub.tasks_ledger` (
  task_id STRING NOT NULL,
  title STRING NOT NULL,
  description STRING,
  category STRING NOT NULL, -- Tech/Dev, Finance, Marketing & Sales, Business & Strategy, Operations & Admin, Client Projects, Personal & Health
  user_priority STRING NOT NULL, -- urgent, high, medium, low
  ai_priority STRING NOT NULL, -- critical, high, medium, low, defer
  feasibility STRING NOT NULL, -- ai_automated, hybrid, human_only
  feasibility_reasoning STRING,
  status STRING NOT NULL, -- backlog, in_progress, automating, completed, blocked
  automation_hours_invested FLOAT64 DEFAULT 0.0,
  time_won_back_hours FLOAT64 DEFAULT 0.0,
  financial_value_won FLOAT64 DEFAULT 0.0,
  start_date DATE,
  due_date DATE,
  progress_percent INT64 DEFAULT 0,
  assignee STRING,
  memo_id STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY start_date
CLUSTER BY category, status, feasibility;

-- 3. Voice Memos & Semantic Vector RAG Table (768-dim Google text-embedding-004)
CREATE TABLE IF NOT EXISTS `homeassistant-506520.executive_assistant_hub.voice_memos_vectors` (
  memo_id STRING NOT NULL,
  title STRING,
  transcript STRING NOT NULL,
  summary STRING,
  category STRING NOT NULL,
  source STRING NOT NULL, -- browser_mic, mobile_pwa, apple_watch
  duration_seconds INT64 DEFAULT 15,
  extracted_tasks_count INT64 DEFAULT 0,
  embedding ARRAY<FLOAT64>, -- 768-dimensional dense vector from text-embedding-004
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at)
CLUSTER BY category;

-- 4. Baxter Family & VIP Contacts Roster Table
CREATE TABLE IF NOT EXISTS `homeassistant-506520.executive_assistant_hub.contacts_roster` (
  contact_id STRING NOT NULL,
  name STRING NOT NULL,
  role STRING,
  email STRING NOT NULL,
  relationship STRING, -- wife, daughter, son, partner, team_lead
  phone STRING,
  is_vip BOOL DEFAULT TRUE,
  notes STRING,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- Seed Baxter Family Roster
MERGE INTO `homeassistant-506520.executive_assistant_hub.contacts_roster` T
USING (
  SELECT 'c-celine' AS contact_id, 'Celine Loeuille' AS name, 'Operations Partner & Wife' AS role, 'celine.loeuille@gmail.com' AS email, 'wife' AS relationship, '+33600000001' AS phone, TRUE AS is_vip, 'Wife & core partner' AS notes UNION ALL
  SELECT 'c-eleonore', 'Eleonore Baxter', 'Daughter', 'eleonore.a.baxter@gmail.com', 'daughter', '+33600000002', TRUE, 'Daughter (Eleanor / Ellie)' UNION ALL
  SELECT 'c-elizabeth', 'Elizabeth Baxter', 'Daughter', 'elizabth.js.baxter@gmail.com', 'daughter', '+33600000003', TRUE, 'Daughter (Eliza / Liz)' UNION ALL
  SELECT 'c-alexander', 'Alexander Baxter', 'Son', 'alexander.j.baxter@gmail.com', 'son', '+33600000004', TRUE, 'Son (Alex)' UNION ALL
  SELECT 'c-angelina', 'Angelina Baxter', 'Daughter', 'angelina.c.baxter@gmail.com', 'daughter', '+33600000005', TRUE, 'Daughter (Lina)'
) S
ON T.contact_id = S.contact_id
WHEN NOT MATCHED THEN
  INSERT (contact_id, name, role, email, relationship, phone, is_vip, notes, updated_at)
  VALUES (S.contact_id, S.name, S.role, S.email, S.relationship, S.phone, S.is_vip, S.notes, CURRENT_TIMESTAMP());

-- 5. Calendar Appointments Table
CREATE TABLE IF NOT EXISTS `homeassistant-506520.executive_assistant_hub.calendar_appointments` (
  appointment_id STRING NOT NULL,
  title STRING NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location STRING,
  status STRING DEFAULT 'confirmed',
  has_conflict BOOLEAN DEFAULT FALSE,
  conflict_details STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- 6. KPI Snapshot Table (For Historical Trend Analysis in Looker Studio)
CREATE TABLE IF NOT EXISTS `homeassistant-506520.executive_assistant_hub.kpi_snapshots` (
  snapshot_date DATE NOT NULL,
  total_tasks INT64,
  total_hours_won_back FLOAT64,
  total_hours_invested FLOAT64,
  net_roi_hours FLOAT64,
  roi_multiplier FLOAT64,
  gross_financial_won_usd FLOAT64,
  net_financial_saved_usd FLOAT64,
  ai_automated_count INT64,
  hybrid_count INT64,
  human_only_count INT64,
  completion_rate_percent INT64,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY snapshot_date;

-- 7. Analytical View for Google Looker Studio Dashboard
CREATE OR REPLACE VIEW `homeassistant-506520.executive_assistant_hub.v_looker_studio_summary` AS
SELECT
  category,
  feasibility,
  user_priority,
  ai_priority,
  status,
  COUNT(task_id) AS total_tasks,
  SUM(time_won_back_hours) AS total_hours_won,
  SUM(automation_hours_invested) AS total_hours_invested,
  SUM(financial_value_won) AS total_financial_value_usd,
  AVG(progress_percent) AS avg_progress_percent
FROM
  `homeassistant-506520.executive_assistant_hub.tasks_ledger`
GROUP BY
  category, feasibility, user_priority, ai_priority, status;

-- 8. Vector Search Inverted File (IVF) Index on Voice Memos
CREATE VECTOR INDEX IF NOT EXISTS `memo_vector_idx`
ON `homeassistant-506520.executive_assistant_hub.voice_memos_vectors`(embedding)
OPTIONS(distance_type = 'COSINE', index_type = 'IVF');
