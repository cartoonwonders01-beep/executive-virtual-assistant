/**
 * Autonomous Cloud Timers & External Webhook Trigger Engine
 */

/**
 * Installs autonomous time-driven triggers (run once)
 */
function setupAutomaticTriggers() {
  // Clear any existing triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));

  // 1. Daily 8:00 AM Morning Executive Briefing
  ScriptApp.newTrigger("runDailyMorningBriefing")
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .nearMinute(0)
    .create();

  // 2. Weekly Friday 5:00 PM Executive ROI Summary
  ScriptApp.newTrigger("runWeeklyROISummary")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.FRIDAY)
    .atHour(17)
    .create();

  Logger.log("✅ Autonomous Cloud Triggers Successfully Installed!");
}

/**
 * Daily 8:00 AM Morning Executive Briefing
 */
function runDailyMorningBriefing() {
  const today = new Date();
  const calendar = CalendarApp.getDefaultCalendar();
  const events = calendar.getEventsForDay(today);
  
  const ss = getOrCreateSpreadsheet();
  const tasksSheet = ss.getSheetByName("Tasks_Ledger");
  const urgentTasks = [];

  if (tasksSheet) {
    const data = tasksSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const priority = (row[3] || "").toString().toLowerCase();
      const status = (row[6] || "").toString().toLowerCase();
      if ((priority === "urgent" || priority === "critical") && status !== "completed") {
        urgentTasks.push(row[1]); // Title
      }
    }
  }

  const eventsList = events.length > 0 
    ? events.map(e => `• ${e.getTitle()} (${e.getStartTime().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})})`).join("\n")
    : "• No scheduled calendar events today.";

  const tasksList = urgentTasks.length > 0
    ? urgentTasks.slice(0, 5).map(t => `• ${t}`).join("\n")
    : "• All high-priority tasks are up to date.";

  const emailSubject = `☀️ Morning Executive Briefing - ${today.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'})}`;
  const emailBody = `Good morning Andrew,\n\n` +
    `Here is your autonomous agenda for today:\n\n` +
    `📅 TODAY'S CALENDAR:\n${eventsList}\n\n` +
    `🎯 CRITICAL & URGENT FOCUS ITEMS:\n${tasksList}\n\n` +
    `Your Looker Studio Dashboard is active and tracking your time won back.\n\n` +
    `Best regards,\nYour Executive AI Assistant`;

  // Send briefing email
  const userEmail = Session.getActiveUser().getEmail() || "andy.j.baxter@gmail.com";
  GmailApp.sendEmail(userEmail, emailSubject, emailBody);
  Logger.log("Morning briefing dispatched to: " + userEmail);
}

/**
 * Weekly Friday ROI & Time Won Back Summary
 */
function runWeeklyROISummary() {
  const ss = getOrCreateSpreadsheet();
  updateKPISummary(ss);
  
  const kpiSheet = ss.getSheetByName("KPI_Summary");
  let hoursWon = 0, dollarWon = 0, totalTasks = 0;

  if (kpiSheet) {
    const rows = kpiSheet.getDataRange().getValues();
    rows.forEach(r => {
      if (r[0] === "Total Hours Won Back") hoursWon = r[1];
      if (r[0] === "Financial Value Won ($)") dollarWon = r[1];
      if (r[0] === "Total Tasks") totalTasks = r[1];
    });
  }

  const userEmail = Session.getActiveUser().getEmail() || "andy.j.baxter@gmail.com";
  const subject = `📊 Weekly Executive ROI Report: +${hoursWon}h Won Back ($${Number(dollarWon).toLocaleString()})`;
  const body = `Hi Andrew,\n\n` +
    `Here is your autonomous automation summary for this week:\n\n` +
    `• Total Tasks Managed: ${totalTasks}\n` +
    `• Total Hours Won Back: +${hoursWon} Hours\n` +
    `• Total Financial Value Created: $${Number(dollarWon).toLocaleString()} USD\n\n` +
    `Your Monday.com Work Hub and Looker Studio reports have been refreshed.\n\n` +
    `Best regards,\nYour Executive AI Assistant`;

  GmailApp.sendEmail(userEmail, subject, body);
  Logger.log("Weekly ROI report dispatched.");
}

/**
 * External Webhook 1: Cloudflare Pages / Vercel Deploy Hook
 */
function triggerWebsiteBuild() {
  if (!CONFIG.CLOUDFLARE_DEPLOY_HOOK || CONFIG.CLOUDFLARE_DEPLOY_HOOK.includes("YOUR_HOOK_ID")) {
    return { status: "simulated", message: "Deploy hook URL not configured, simulation success." };
  }

  const response = UrlFetchApp.fetch(CONFIG.CLOUDFLARE_DEPLOY_HOOK, {
    method: "POST"
  });

  return {
    status: "triggered",
    code: response.getResponseCode(),
    spokenResponse: "Website build triggered successfully on Cloudflare edge."
  };
}

/**
 * External Webhook 2: Home Assistant Green (ha-green) Software Correction
 */
function triggerHAGreenCorrection(serviceName, details) {
  if (!CONFIG.HA_GREEN_WEBHOOK || CONFIG.HA_GREEN_WEBHOOK.includes("YOUR_HA_WEBHOOK")) {
    return { 
      status: "simulated", 
      service: serviceName || "restart_service",
      spokenResponse: `Simulated HA Green correction for ${serviceName || "service"}.`
    };
  }

  const payload = {
    action: serviceName || "system_health_check",
    target: "ha-green",
    timestamp: new Date().toISOString(),
    details: details || {}
  };

  const response = UrlFetchApp.fetch(CONFIG.HA_GREEN_WEBHOOK, {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  });

  return {
    status: "dispatched",
    response: response.getContentText(),
    spokenResponse: `Software correction dispatched to Home Assistant Green.`
  };
}
