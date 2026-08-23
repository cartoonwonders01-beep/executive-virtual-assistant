/**
 * Executive AI Personal Assistant - Google Apps Script Universal Cloud Engine
 * 100% Serverless, 24/7 background execution on Google Cloud
 */

const CONFIG = {
  SPREADSHEET_ID: "YOUR_SPREADSHEET_ID_HERE", // Auto-created or set via setup
  CLOUDFLARE_DEPLOY_HOOK: "https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/YOUR_HOOK_ID",
  HA_GREEN_WEBHOOK: "https://hooks.nabucasa.com/YOUR_HA_WEBHOOK_KEY",
  DEFAULT_HOURLY_RATE: 200 // $200/hr executive value
};

/**
 * Webhook POST Handler (Receives voice events from Relay PWA, Apple Shortcuts, Siri)
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || payload.intent || "PROCESS_VOICE_INTENT";
    let result = {};

    switch (action) {
      case "calendar_booking":
      case "CALENDAR_BOOKING":
        result = handleCalendarBooking(payload);
        break;

      case "email_draft":
      case "EMAIL_DRAFT":
        result = handleEmailDraft(payload);
        break;

      case "task_create":
      case "TASK_CREATE":
      case "VOICE_MEMO":
        result = handleTaskAndMemoIngest(payload);
        break;

      case "TRIGGER_WEBSITE_BUILD":
        result = triggerWebsiteBuild();
        break;

      case "TRIGGER_HA_GREEN":
        result = triggerHAGreenCorrection(payload.serviceName, payload.details);
        break;

      case "GET_LOOKER_DATA":
        result = getLookerStudioDataFeed();
        break;

      default:
        result = handleGeneralVoiceIntent(payload);
        break;
    }

    // Always append task/memo to Google Sheets Warehouse for Looker Studio
    if (payload.tasks || payload.taskData) {
      recordTasksToSheets(payload.tasks || [payload.taskData]);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      timestamp: new Date().toISOString(),
      result: result
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: error.toString(),
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Webhook GET Handler (Returns live status & data feed for Looker Studio)
 */
function doGet(e) {
  const data = getLookerStudioDataFeed();
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Setup function: Run once to initialize Google Sheets Data Warehouse
 */
function setupAssistantDataWarehouse() {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create("Executive Assistant Work Hub - Data Warehouse");
  
  // Sheet 1: Tasks_Ledger
  let tasksSheet = ss.getSheetByName("Tasks_Ledger");
  if (!tasksSheet) {
    tasksSheet = ss.insertSheet("Tasks_Ledger");
    tasksSheet.appendRow([
      "Task ID", "Title", "Category", "User Priority", "AI Priority", 
      "Feasibility", "Status", "Hours Invested", "Hours Won Back", 
      "Financial Value Won ($)", "Start Date", "Due Date", "Assignee", 
      "Created At", "Description"
    ]);
    tasksSheet.getRange("A1:O1").setFontWeight("bold").setBackground("#1e293b").setFontColor("#f8fafc");
  }

  // Sheet 2: Voice_Memos
  let memosSheet = ss.getSheetByName("Voice_Memos");
  if (!memosSheet) {
    memosSheet = ss.insertSheet("Voice_Memos");
    memosSheet.appendRow(["Memo ID", "Transcript", "Duration (s)", "Source", "Status", "Created At"]);
    memosSheet.getRange("A1:F1").setFontWeight("bold").setBackground("#1e293b").setFontColor("#f8fafc");
  }

  // Sheet 3: KPI_Summary
  let kpiSheet = ss.getSheetByName("KPI_Summary");
  if (!kpiSheet) {
    kpiSheet = ss.insertSheet("KPI_Summary");
    kpiSheet.appendRow(["Metric", "Value", "Unit", "Updated At"]);
    kpiSheet.getRange("A1:D1").setFontWeight("bold").setBackground("#1e293b").setFontColor("#f8fafc");
  }

  Logger.log("Data Warehouse Initialized: " + ss.getUrl());
  return ss.getId();
}
