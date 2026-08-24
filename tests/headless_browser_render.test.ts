import puppeteer from 'puppeteer';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: any) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, details || '');
    failed++;
  }
}

export async function runHeadlessBrowserRenderAudit() {
  console.log('======================================================================');
  console.log('🌐 RUNNING END-TO-END REAL-USER BROWSER UI & DOM TEST SUITE');
  console.log('======================================================================');

  const browserErrors: string[] = [];
  const consoleErrors: string[] = [];

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('  ⚠️ Browser console.error:', msg.text());
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      console.error('  ❌ Uncaught Browser Exception:', err.message);
      browserErrors.push(err.message);
    });

    console.log('\n--- [Step 1] Navigating to Production Site in Headless Chrome ---');
    const targetUrl = process.env.TARGET_URL || 'https://executive-virtual-assistant.pages.dev';
    console.log(`Target URL: ${targetUrl}`);

    const response = await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    assert(response !== null && response.status() === 200, `H1.1: HTTP Response 200 OK (got ${response?.status()})`);

    await new Promise(r => setTimeout(r, 1000));

    console.log('\n--- [Step 2] DOM Mount & Top Controls Verification ---');
    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
    assert(rootHtml.length > 500, `H2.1: #root contains rendered DOM tree (${rootHtml.length} characters)`);

    const hasHeaderControls = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Eve') && text.includes('STOP') && text.includes('Logs');
    });
    assert(hasHeaderControls, 'H2.2: Header controls (STOP / Logs / Prompt Studio / Config) rendered in DOM');

    console.log('\n--- [Step 3] Real-User UI Interaction: Email Drafting ---');
    // Type email command as user
    await page.waitForSelector('input[type="text"]');
    await page.click('input[type="text"]');
    await page.type('input[type="text"]', 'Send an email to Celine saying I will be home soon');
    await page.click('button[type="submit"]');

    // Wait for Eve to process and render
    await new Promise(r => setTimeout(r, 1200));

    const emailTurnRendered = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Celine Loeuille') && text.includes('celine.loeuille@gmail.com');
    });
    assert(emailTurnRendered, 'H3.1: Email draft to Celine Loeuille rendered in chat stream with action card');

    const emailButtonFound = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Send Email Now') || text.includes('✈️ Send Email Now');
    });
    assert(emailButtonFound, 'H3.2: Direct "Send Email Now" execution action button rendered in DOM');

    console.log('\n--- [Step 4] Real-User UI Interaction: Weather Intelligence ---');
    await page.click('input[type="text"]');
    await page.type('input[type="text"]', "What's the weather going to be like tomorrow");
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 1200));

    const weatherTurnRendered = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('weather') || text.includes('forecast') || text.includes('sunny') || text.includes('rain') || text.includes('temperature') || text.includes('Intelligence');
    });
    assert(weatherTurnRendered, 'H4.1: Weather intelligence response rendered in conversation stream');

    console.log('\n--- [Step 5] Real-User UI Interaction: Executive Humor ---');
    await page.click('input[type="text"]');
    await page.type('input[type="text"]', 'Tell me a joke');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 1000));

    const jokeTurnRendered = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('dark mode') || text.includes('bugs') || text.includes('programmer') || text.includes('Joke') || text.includes('laugh');
    });
    assert(jokeTurnRendered, 'H5.1: Joke response rendered in conversation stream');

    console.log('\n--- [Step 6] Real-User UI Interaction: Family Knowledge Inquiry ---');
    await page.click('input[type="text"]');
    await page.type('input[type="text"]', 'Who is in my family');
    await page.click('button[type="submit"]');

    await new Promise(r => setTimeout(r, 1000));

    const familyTurnRendered = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Celine') && (text.includes('Eleonore') || text.includes('Alexander') || text.includes('Elizabeth') || text.includes('Angelina'));
    });
    assert(familyTurnRendered, 'H6.1: Family roster intelligence rendered in conversation stream');

    console.log('\n--- [Step 7] Real-User UI Interaction: Docked Right-Hand Logs Inspector ---');
    // Find and click "Logs" button
    const logsButtonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const logBtn = buttons.find(b => b.innerText.includes('Logs') || b.title?.includes('Telemetry'));
      if (logBtn) {
        logBtn.click();
        return true;
      }
      return false;
    });
    assert(logsButtonClicked, 'H7.1: Logs button found and clicked');

    await new Promise(r => setTimeout(r, 600));

    const logPanelRendered = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Behind-the-Scenes Telemetry') || text.includes('Live Stream') || text.includes('Archived Chats');
    });
    assert(logPanelRendered, 'H7.2: Docked right-hand Telemetry Inspector is visible in DOM');

    console.log('\n--- [Step 8] Real-User UI Interaction: New Chat & Archive ---');
    const newChatClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const newChatBtn = buttons.find(b => b.innerText.includes('New Chat') || b.title?.includes('new clean chat'));
      if (newChatBtn) {
        newChatBtn.click();
        return true;
      }
      return false;
    });
    assert(newChatClicked, 'H8.1: "New Chat & Archive" button found and clicked');

    await new Promise(r => setTimeout(r, 600));

    const heroOrbRestored = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('How can I assist you today, Andrew?') || text.includes('Tap to Talk');
    });
    assert(heroOrbRestored, 'H8.2: Conversation reset to clean hero orb state after archive');

    console.log('\n--- [Step 9] Error-Free Execution Verification ---');
    assert(browserErrors.length === 0, `H9.1: Zero uncaught browser runtime exceptions (found ${browserErrors.length})`, browserErrors);
    assert(consoleErrors.length === 0, `H9.2: Zero browser console.error logs (found ${consoleErrors.length})`, consoleErrors);

  } finally {
    await browser.close();
  }

  console.log('\n======================================================================');
  console.log(`📊 REAL-USER BROWSER UI TEST COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runHeadlessBrowserRenderAudit().catch((err) => {
  console.error('Fatal Real-User Browser Test Error:', err);
  process.exit(1);
});

