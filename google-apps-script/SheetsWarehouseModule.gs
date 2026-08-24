/**
 * Google Sheets Data Warehouse & Looker Studio Feed Module
 */

function handleTaskAndMemoIngest(payload) {
  const ss = getOrCreateSpreadsheet();
  const tasks = payload.tasks || (payload.taskData ? [payload.taskData] : []);
  const memo = payload.memo || {
    id: "memo-" + Date.now().toString(36),
    transcript: payload.transcript || payload.text || "",
    durationSeconds: payload.durationSeconds || 15,
    source: payload.source || "mobile_pwa",
    createdAt: new Date().toISOString()
  };

  // 1. Record Voice Memo
  const memosSheet = ss.getSheetByName("Voice_Memos") || ss.insertSheet("Voice_Memos");
  memosSheet.appendRow([
    memo.id,
    memo.transcript,
    memo.durationSeconds,
    memo.source,
    "analyzed",
    memo.createdAt || new Date().toISOString()
  ]);

  // 2. Record Extracted Tasks
  const createdTasks = recordTasksToSheets(tasks, ss);

  // 3. Update KPI Summary
  updateKPISummary(ss);

  const spoken = `Logged voice memo and added ${createdTasks.length} task(s) to your Google Data Warehouse. Your Looker Studio dashboard has been updated.`;

  return {
    status: "recorded",
    memoId: memo.id,
    tasksCount: createdTasks.length,
    spokenResponse: spoken
  };
}

function recordTasksToSheets(tasks, spreadsheet) {
  if (!tasks || tasks.length === 0) return [];
  const ss = spreadsheet || getOrCreateSpreadsheet();
  const tasksSheet = ss.getSheetByName("Tasks_Ledger") || ss.insertSheet("Tasks_Ledger");
  const hourlyRate = CONFIG.DEFAULT_HOURLY_RATE || 200;

  const created = [];
  tasks.forEach((t, idx) => {
    const taskId = t.id || ("task-" + Date.now().toString(36) + "-" + (idx + 1));
    const title = t.title || "Executive Action Item";
    const category = t.category || "Tech/Dev";
    const userPriority = t.userPriority || "high";
    const aiPriority = t.aiPriority || "critical";
    const feasibility = t.feasibility || "ai_automated";
    const status = t.status || "in_progress";
    const hoursInvested = t.automationHoursInvested || t.hoursInvested || 2;
    const hoursWonBack = t.timeWonBackHours || t.hoursWonBack || 10;
    const assignee = t.assignee || (feasibility === "ai_automated" ? "AI Agent" : (t.speaker || "Andrew"));
    const speaker = t.speaker || t.userName || payload?.userName || payload?.speaker || "Andrew";
    const createdAt = t.createdAt || new Date().toISOString();
    const description = t.description || title;

    tasksSheet.appendRow([
      taskId, title, category, userPriority, aiPriority,
      feasibility, status, hoursInvested, hoursWonBack,
      financialValueWon, startDate, dueDate, assignee,
      createdAt, description, speaker
    ]);

    created.push({ id: taskId, title, category, feasibility, hoursWonBack, financialValueWon, speaker });
  });

  return created;
}

function updateKPISummary(spreadsheet) {
  const ss = spreadsheet || getOrCreateSpreadsheet();
  const tasksSheet = ss.getSheetByName("Tasks_Ledger");
  if (!tasksSheet) return;

  const data = tasksSheet.getDataRange().getValues();
  if (data.length <= 1) return;

  let totalTasks = data.length - 1;
  let totalHoursWon = 0;
  let totalHoursInvested = 0;
  let aiCount = 0;
  let hybridCount = 0;
  let humanCount = 0;
  let completedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const feasibility = row[5];
    const status = row[6];
    const invested = Number(row[7]) || 0;
    const won = Number(row[8]) || 0;

    totalHoursInvested += invested;
    totalHoursWon += won;

    if (feasibility === "ai_automated") aiCount++;
    else if (feasibility === "hybrid") hybridCount++;
    else humanCount++;

    if (status === "completed") completedCount++;
  }

  const netROIHours = totalHoursWon - totalHoursInvested;
  const roiMultiplier = totalHoursInvested > 0 ? (totalHoursWon / totalHoursInvested).toFixed(1) : "0.0";
  const rate = CONFIG.DEFAULT_HOURLY_RATE || 200;
  const financialWon = totalHoursWon * rate;
  const netDollarSaved = netROIHours * rate;

  let kpiSheet = ss.getSheetByName("KPI_Summary") || ss.insertSheet("KPI_Summary");
  kpiSheet.clearContents();
  kpiSheet.appendRow(["Metric", "Value", "Unit", "Updated At"]);
  
  const nowStr = new Date().toISOString();
  kpiSheet.appendRow(["Total Tasks", totalTasks, "Tasks", nowStr]);
  kpiSheet.appendRow(["Total Hours Won Back", totalHoursWon, "Hours", nowStr]);
  kpiSheet.appendRow(["Total Hours Invested", totalHoursInvested, "Hours", nowStr]);
  kpiSheet.appendRow(["Net ROI Hours", netROIHours, "Hours", nowStr]);
  kpiSheet.appendRow(["ROI Multiplier", roiMultiplier, "x Multiplier", nowStr]);
  kpiSheet.appendRow(["Financial Value Won ($)", financialWon, "USD ($)", nowStr]);
  kpiSheet.appendRow(["Net Financial Saved ($)", netDollarSaved, "USD ($)", nowStr]);
  kpiSheet.appendRow(["AI Automated Tasks", aiCount, "Tasks", nowStr]);
  kpiSheet.appendRow(["Hybrid Tasks", hybridCount, "Tasks", nowStr]);
  kpiSheet.appendRow(["Human Only Tasks", humanCount, "Tasks", nowStr]);
  kpiSheet.appendRow(["Completed Tasks", completedCount, "Tasks", nowStr]);
  kpiSheet.appendRow(["Completion Rate", Math.round((completedCount / totalTasks) * 100), "%", nowStr]);
}

function getOrCreateSpreadsheet() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID_HERE") {
    try {
      return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    } catch (e) {}
  }
  const files = DriveApp.getFilesByName("Executive Assistant Work Hub - Data Warehouse");
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  return SpreadsheetApp.create("Executive Assistant Work Hub - Data Warehouse");
}

function getLookerStudioDataFeed() {
  const ss = getOrCreateSpreadsheet();
  const tasksSheet = ss.getSheetByName("Tasks_Ledger");
  const kpiSheet = ss.getSheetByName("KPI_Summary");

  return {
    spreadsheetUrl: ss.getUrl(),
    tasksCount: tasksSheet ? tasksSheet.getLastRow() - 1 : 0,
    kpiUpdated: kpiSheet ? true : false,
    timestamp: new Date().toISOString()
  };
}
