# Google Apps Script Universal Cloud Engine Setup Guide

## 1. Overview
This Google Apps Script engine runs **100% serverless on Google Cloud infrastructure** at **$0/month**. It serves as your autonomous 24/7 assistant brain connecting your **Relay Voice PWA**, **Gmail**, **Google Calendar**, **Google BigQuery**, **Google Sheets**, and **Google Looker Studio**.

---

## 2. 60-Second Setup Instructions

1. Go to **[https://script.google.com](https://script.google.com)** and click **New Project**.
2. Name the project: `Executive-Assistant-Cloud-Engine`.
3. Copy and paste the 4 files into the editor:
   - `Code.gs`
   - `CalendarModule.gs`
   - `GmailModule.gs`
   - `SheetsWarehouseModule.gs`
   - `CronTriggers.gs`
4. Click **Project Settings ⚙️** $\to$ Check **"Show 'appsscript.json' manifest file in editor"** $\to$ Paste the contents of `appsscript.json`.
5. Run the `setupAssistantDataWarehouse` function once by selecting it from the dropdown and clicking **Run ▶️** (this auto-creates your Google Sheets Data Warehouse with proper headers and formatting).
6. Run `setupAutomaticTriggers` once to install your **Daily 8:00 AM Morning Briefing** and **Friday ROI Report** cron jobs.
7. Click **Deploy 🚀** $\to$ **New Deployment**:
   - Select type: **Web App**
   - Execute as: **Me** (`andy.j.baxter@gmail.com`)
   - Who has access: **Anyone** (allows your mobile PWA and Siri shortcuts to post events)
8. Copy your **Web App URL** (e.g. `https://script.google.com/macros/s/AKfycbx.../exec`).
9. Paste this Web App URL into the **Settings ⚙️** modal in your Relay Voice PWA!

---

## 3. Endpoints & Actions Supported

### `POST /exec`
```json
{
  "action": "calendar_booking",
  "calendarData": {
    "title": "Meeting with David Miller",
    "startDateTime": "2026-08-25T14:00:00Z",
    "endDateTime": "2026-08-25T14:45:00Z",
    "attendees": ["david.m@cloudscale.io"]
  }
}
```

```json
{
  "action": "email_draft",
  "emailData": {
    "to": "sarah.c@growthpulse.ai",
    "toName": "Sarah Chen",
    "subject": "Q3 Growth Sprint Alignment",
    "body": "Hi Sarah,\n\nFollowing up on our Q3 sprint...\n\nBest,\nAndrew"
  }
}
```

```json
{
  "action": "TRIGGER_WEBSITE_BUILD"
}
```

```json
{
  "action": "TRIGGER_HA_GREEN",
  "serviceName": "restart_zigbee_bridge"
}
```
