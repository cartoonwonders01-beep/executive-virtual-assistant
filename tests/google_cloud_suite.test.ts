// Automated Verification Suite for Google AI Ultra Cloud Architecture
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runGoogleCloudSuite() {
  console.log('\n🚀 Starting Google Cloud & AI Ultra Suite Verification...\n');

  // TEST GROUP 1: Google Apps Script Manifest & Engine Files
  console.log('--- 1. Google Apps Script Engine Files & Manifest ---');
  const gasDir = path.join(process.cwd(), 'google-apps-script');
  const manifestPath = path.join(gasDir, 'appsscript.json');
  assert(fs.existsSync(manifestPath), 'appsscript.json manifest exists');
  
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifest.oauthScopes.includes('https://www.googleapis.com/auth/calendar'), 'Manifest has Calendar OAuth scope');
  assert(manifest.oauthScopes.includes('https://www.googleapis.com/auth/gmail.compose'), 'Manifest has Gmail OAuth scope');
  assert(manifest.oauthScopes.includes('https://www.googleapis.com/auth/spreadsheets'), 'Manifest has Spreadsheets OAuth scope');

  assert(fs.existsSync(path.join(gasDir, 'Code.gs')), 'Code.gs exists');
  assert(fs.existsSync(path.join(gasDir, 'CalendarModule.gs')), 'CalendarModule.gs exists');
  assert(fs.existsSync(path.join(gasDir, 'GmailModule.gs')), 'GmailModule.gs exists');
  assert(fs.existsSync(path.join(gasDir, 'SheetsWarehouseModule.gs')), 'SheetsWarehouseModule.gs exists');
  assert(fs.existsSync(path.join(gasDir, 'CronTriggers.gs')), 'CronTriggers.gs exists');

  // TEST GROUP 2: BigQuery Schema & SQL DDL
  console.log('\n--- 2. Google BigQuery Schema & Views ---');
  const bqPath = path.join(process.cwd(), 'google-cloud', 'bigquery_schema.sql');
  assert(fs.existsSync(bqPath), 'bigquery_schema.sql exists');
  const bqSql = fs.readFileSync(bqPath, 'utf8');
  assert(bqSql.includes('CREATE SCHEMA IF NOT EXISTS `executive_assistant_hub`'), 'Creates executive_assistant_hub schema');
  assert(bqSql.includes('CREATE TABLE IF NOT EXISTS `executive_assistant_hub.tasks_ledger`'), 'Creates tasks_ledger table');
  assert(bqSql.includes('CREATE TABLE IF NOT EXISTS `executive_assistant_hub.voice_memos`'), 'Creates voice_memos table');
  assert(bqSql.includes('CREATE TABLE IF NOT EXISTS `executive_assistant_hub.calendar_appointments`'), 'Creates calendar_appointments table');
  assert(bqSql.includes('CREATE OR REPLACE VIEW `executive_assistant_hub.v_looker_studio_summary`'), 'Creates Looker Studio analytical view');

  // TEST GROUP 3: Seed Data & Looker Studio Metrics
  console.log('\n--- 3. Seed Data & Looker Studio Metric Mathematics ---');
  const seedPath = path.join(process.cwd(), 'google-cloud', 'sample_seed_data.json');
  assert(fs.existsSync(seedPath), 'sample_seed_data.json exists');
  const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  assert(seedData.tasks.length >= 6, `Seed data contains ${seedData.tasks.length} tasks`);

  const totalHoursWon = seedData.tasks.reduce((sum: number, t: any) => sum + (t.timeWonBackHours || 0), 0);
  const totalHoursInvested = seedData.tasks.reduce((sum: number, t: any) => sum + (t.automationHoursInvested || 0), 0);
  const totalDollarWon = seedData.tasks.reduce((sum: number, t: any) => sum + (t.financialValueWon || 0), 0);
  const multiplier = Number((totalHoursWon / totalHoursInvested).toFixed(1));

  assert(totalHoursWon >= 80, `Total hours won correctly aggregated: ${totalHoursWon}h`);
  assert(totalDollarWon >= 16000, `Total financial value correctly calculated: $${totalDollarWon.toLocaleString()}`);
  assert(multiplier >= 5.0, `ROI multiplier calculated: ${multiplier}x`);

  // TEST GROUP 4: Looker Studio Blueprint
  console.log('\n--- 4. Looker Studio Blueprint Template ---');
  const lookerPath = path.join(process.cwd(), 'looker-studio', 'LOOKER_STUDIO_TEMPLATE.md');
  assert(fs.existsSync(lookerPath), 'LOOKER_STUDIO_TEMPLATE.md exists');
  const lookerContent = fs.readFileSync(lookerPath, 'utf8');
  assert(lookerContent.includes('SUM(Hours Won Back)'), 'Includes Hours Won Back formula');
  assert(lookerContent.includes('Dual-Priority Eisenhower Matrix'), 'Includes Dual-Priority 2x2 scatter chart config');
  assert(lookerContent.includes('Gantt & Milestone Timeline'), 'Includes Gantt timeline chart config');

  // TEST GROUP 5: Gemini Service Integration
  console.log('\n--- 5. Gemini AI Service ---');
  const geminiPath = path.join(process.cwd(), 'src', 'services', 'geminiService.ts');
  assert(fs.existsSync(geminiPath), 'geminiService.ts exists');
  const geminiCode = fs.readFileSync(geminiPath, 'utf8');
  assert(geminiCode.includes('generativelanguage.googleapis.com'), 'Uses Google AI Studio Gemini API endpoint');
  assert(geminiCode.includes('gemini-1.5-flash') && geminiCode.includes('gemini-1.5-pro'), 'Supports Gemini 1.5 Pro & Flash');

  // Summary
  console.log('\n======================================================');
  console.log(`📊 GOOGLE CLOUD SUITE RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runGoogleCloudSuite().catch(err => {
  console.error('Fatal Google Cloud suite error:', err);
  process.exit(1);
});
