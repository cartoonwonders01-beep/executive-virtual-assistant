-- ==============================================================================
-- Google BigQuery Schema: Executive AI Assistant Data Warehouse
-- Dataset: executive_assistant_hub
-- ==============================================================================

-- 1. Create Dataset
CREATE SCHEMA IF NOT EXISTS `executive_assistant_hub`
OPTIONS (
  location = 'EU',
  description = 'Data Warehouse for Executive AI Personal Assistant & Monday Work Hub'
);

-- 2. Tasks Ledger Table
CREATE TABLE IF NOT EXISTS `executive_assistant_hub.tasks_ledger` (
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

-- 3. Voice Memos Ledger Table
CREATE TABLE IF NOT EXISTS `executive_assistant_hub.voice_memos` (
  memo_id STRING NOT NULL,
  transcript STRING NOT NULL,
  duration_seconds INT64 DEFAULT 15,
  source STRING NOT NULL, -- mobile_pwa, browser_mic, ios_shortcut, apple_watch
  status STRING DEFAULT 'analyzed',
  extracted_tasks_count INT64 DEFAULT 0,
  audio_url STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at);

-- 4. Calendar Appointments Table
CREATE TABLE IF NOT EXISTS `executive_assistant_hub.calendar_appointments` (
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

-- 5. KPI Snapshot Table (For Historical Trend Analysis in Looker Studio)
CREATE TABLE IF NOT EXISTS `executive_assistant_hub.kpi_snapshots` (
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

-- 6. Analytical View for Google Looker Studio
CREATE OR REPLACE VIEW `executive_assistant_hub.v_looker_studio_summary` AS
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
  `executive_assistant_hub.tasks_ledger`
GROUP BY
  category, feasibility, user_priority, ai_priority, status;
