import { AutomationBlueprint, TaskCategory } from '../src/types';

export function generateAutomationBlueprint(
  taskTitle: string,
  taskDescription: string,
  category: TaskCategory
): AutomationBlueprint {
  const titleLower = taskTitle.toLowerCase();
  const descLower = taskDescription.toLowerCase();
  const combined = titleLower + ' ' + descLower;

  // 1. Scraping / Competitor Price Monitoring
  if (/scrap|crawl|monitor|track|check|pric|competitor/i.test(combined)) {
    return {
      strategy: [
        '1. Headless browser automation (Playwright/Puppeteer) runs inside Parallels Linux VM (10.211.55.6).',
        '2. Fetch and render target DOM, extracting relevant metrics, price points, and tables.',
        '3. Compare with SQLite cached hash state to detect significant diffs.',
        '4. Format diff report via LLM into a bulleted executive summary.',
        '5. Dispatch webhook notification and push to Work Hub dashboard.'
      ],
      toolsNeeded: ['Playwright / Puppeteer', 'Node.js / TypeScript', 'SQLite Cache', 'Telegram/Discord Webhook'],
      codeLanguage: 'typescript',
      executableCodeSample: `import { chromium } from "playwright";\n\nexport async function runScraperJob() {\n  const browser = await chromium.launch({ headless: true });\n  const page = await browser.newPage();\n  await page.goto("https://competitor.com/pricing", { waitUntil: "networkidle" });\n  const pricing = await page.$$eval(".pricing-card", cards => cards.map(c => ({\n    tier: c.querySelector("h3")?.textContent?.trim(),\n    price: c.querySelector(".price")?.textContent?.trim()\n  })));\n  await browser.close();\n  console.log("Scraped Pricing Tiers:", pricing);\n  return pricing;\n}`,
      bestPractices: [
        'Run browser jobs inside isolated sandbox VM to protect macOS host.',
        'Implement jittered delays between page requests to avoid rate limits.',
        'Store DOM snapshots in R2 or local storage for historical regression comparison.'
      ],
      webInspiration: [
        { title: 'Modern Headless Browser Pipelines on Cloudflare Containers', url: 'https://developers.cloudflare.com/containers', keyTakeaway: 'Use containerized headless browser instances with persistent volumes for reliable crawls.' },
        { title: 'Best Practices for Content Diff Parsing', keyTakeaway: 'Convert HTML to Markdown before running LLM diffs to save 70% tokens.' }
      ],
      executionReadiness: 'ready',
      estimatedHoursToBuild: 3.5,
      recurringHoursSavedPerMonth: 10
    };
  }

  // 2. Invoice / Receipt / Financial Document OCR
  if (/invoice|receipt|pdf|bill|vat|accounting|ledger/i.test(combined)) {
    return {
      strategy: [
        '1. Inbound email or file trigger pipes raw binary into OCR parser.',
        '2. Workers AI / Gemini multimodal endpoint extracts JSON schema: { vendor, date, total, vat, items }.',
        '3. Validate mathematical totals (subtotal + vat == total) and flag discrepancies.',
        '4. Append clean structured row to Google Sheets or SQLite accounting database.',
        '5. Send instant Mobile HUD confirmation card.'
      ],
      toolsNeeded: ['Cloudflare Email Service', 'Workers AI / Gemini Vision API', 'Google Sheets API', 'Postgres/SQLite'],
      codeLanguage: 'typescript',
      executableCodeSample: `import { GoogleSpreadsheet } from "google-spreadsheet";\n\nexport async function appendLedgerEntry(entry: { vendor: string; date: string; amount: number; vat: number }) {\n  const doc = new GoogleSpreadsheet(process.env.SHEET_ID, auth);\n  await doc.loadInfo();\n  const sheet = doc.sheetsByIndex[0];\n  await sheet.addRow([entry.date, entry.vendor, entry.amount, entry.vat, "AUTO_PARSED"]);\n}`,
      bestPractices: [
        'Generate sha256 checksum of invoice PDF to prevent duplicate entries.',
        'Enforce strict Zod schema validation before saving to accounting sheets.'
      ],
      webInspiration: [
        { title: 'Zero-Shot Vision Extraction for Financial Documents', keyTakeaway: 'Structured JSON output mode eliminates regex parsing errors.' }
      ],
      executionReadiness: 'ready',
      estimatedHoursToBuild: 4,
      recurringHoursSavedPerMonth: 14
    };
  }

  // 3. VIP Inbox Triager & Email Summary
  if (/inbox|email|mail|triage|filter|vip/i.test(combined)) {
    return {
      strategy: [
        '1. Connect IMAP / Gmail API with push notification webhook on new incoming mail.',
        '2. Filter senders against executive VIP list and contact database.',
        '3. Run fast Llama-3.3 / Gemini summary for urgent action requests.',
        '4. Draft recommended response directly into drafts folder.',
        '5. Post action notification card to Mobile HUD.'
      ],
      toolsNeeded: ['Gmail / IMAP API', 'Groq Llama-3.3 70B', 'SQLite Contacts DB'],
      codeLanguage: 'typescript',
      executableCodeSample: `export async function triageIncomingEmail(email: { from: string; subject: string; body: string }) {\n  const isVIP = checkVIPStatus(email.from);\n  if (!isVIP) return { action: "archive_or_defer" };\n  \n  const draft = await generateExecutiveDraft(email.body);\n  return { action: "create_draft", draft };\n}`,
      bestPractices: [
        'Never auto-send emails without explicit user approval.',
        'Sanitize tracking pixels and unsubscribe links before summarization.'
      ],
      webInspiration: [
        { title: 'Autonomous Inbox Zero with Agentic Pipelines', keyTakeaway: 'Prioritize by sender urgency score before parsing message length.' }
      ],
      executionReadiness: 'ready',
      estimatedHoursToBuild: 3,
      recurringHoursSavedPerMonth: 16
    };
  }

  // 4. Stripe MRR & Churn Alert Reporter
  if (/stripe|mrr|churn|revenue|subscription|billing/i.test(combined)) {
    return {
      strategy: [
        '1. Listen to Stripe webhook events: invoice.payment_succeeded, customer.subscription.deleted.',
        '2. Calculate 24h Net New MRR, expansions, and churn delta.',
        '3. Format daily morning executive financial brief.',
        '4. Send summary to Mobile Voice HUD & Slack/Discord channel.'
      ],
      toolsNeeded: ['Stripe Webhook API', 'Cloudflare Worker', 'SQLite Financial Log'],
      codeLanguage: 'typescript',
      executableCodeSample: `export async function handleStripeWebhook(event: Stripe.Event) {\n  if (event.type === "customer.subscription.deleted") {\n    const sub = event.data.object as Stripe.Subscription;\n    await logChurnEvent(sub.id, sub.customer as string);\n  }\n  return { status: "processed" };\n}`,
      bestPractices: [
        'Verify Stripe webhook signatures using stripe.webhooks.constructEvent.',
        'Group micro-transactions into aggregated hourly digests to prevent alert fatigue.'
      ],
      webInspiration: [
        { title: 'Real-Time SaaS Metrics Pipelines', keyTakeaway: 'Store idempotent event IDs to prevent double-counting subscription events.' }
      ],
      executionReadiness: 'ready',
      estimatedHoursToBuild: 2.5,
      recurringHoursSavedPerMonth: 8
    };
  }

  // 5. Lead Enrichment & Research Agent
  if (/lead|prospect|linkedin|enrich|research|crm/i.test(combined)) {
    return {
      strategy: [
        '1. Accept lead domain or LinkedIn URL from inbound voice memo.',
        '2. Fetch company headcount, funding round, and tech stack via Clearbit/Enrichment API.',
        '3. Formulate custom personalized icebreaker and value proposition.',
        '4. Append enriched row to CRM / Monday.com Client Projects table.'
      ],
      toolsNeeded: ['Clearbit / Proxycurl API', 'Groq Llama-3.3 70B', 'CRM Webhook'],
      codeLanguage: 'python',
      executableCodeSample: `import requests, json\n\ndef enrich_company_profile(domain: str):\n    res = requests.get(f"https://api.clearbit.com/v2/companies/find?domain={domain}", headers={"Authorization": f"Bearer {API_KEY}"})\n    data = res.json()\n    return {\n        "name": data.get("name"),\n        "employees": data.get("metrics", {}).get("employees"),\n        "tech": data.get("tech")\n    }`,
      bestPractices: [
        'Cache domain queries for 30 days to save API credit consumption.',
        'Enforce strict privacy policy compliance when scraping public profiles.'
      ],
      webInspiration: [
        { title: 'Modern Agentic Outbound Research', keyTakeaway: 'Combine tech stack signals with recent hiring patterns for highest outreach reply rates.' }
      ],
      executionReadiness: 'ready',
      estimatedHoursToBuild: 4,
      recurringHoursSavedPerMonth: 18
    };
  }

  // 6. Default: General Tech / API Integration Recipe
  return {
    strategy: [
      '1. Define automated trigger conditions and schema validation rules.',
      '2. Implement AI-assisted prompt template with structured JSON output parser.',
      '3. Execute pipeline on local Linux sandbox (`sandbox-vm`) or Cloudflare Worker edge.',
      '4. Log completion metrics to Monday.com Work Hub and calculate hours won back.'
    ],
    toolsNeeded: ['Cloudflare Workers / Node.js', 'Groq / Gemini AI API', 'D1 SQLite', 'Cron Trigger'],
    codeLanguage: 'typescript',
    executableCodeSample: `export default {\n  async fetch(req: Request, env: Env): Promise<Response> {\n    const payload = await req.json();\n    console.log("Automating workflow for:", payload);\n    return Response.json({ success: true, timestamp: new Date().toISOString() });\n  }\n};`,
    bestPractices: [
      'Always execute untrusted code in isolated sandbox VM.',
      'Provide idempotent retry handles for transient network errors.'
    ],
    webInspiration: [
      { title: 'Event-Driven Architectures on Cloudflare Edge', url: 'https://developers.cloudflare.com/workflows', keyTakeaway: 'Use durable execution state machines for multi-step tasks.' }
    ],
    executionReadiness: 'ready',
    estimatedHoursToBuild: 3,
    recurringHoursSavedPerMonth: 12
  };
}
