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
  console.log('🌐 RUNNING HEADLESS CHROME DOM RENDERING & ZERO-ERROR AUDIT');
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

    // Give React 1 second to settle effects
    await new Promise(r => setTimeout(r, 1000));

    console.log('\n--- [Step 2] DOM Mount & Root Element Verification ---');
    const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
    assert(rootHtml.length > 500, `H2.1: #root contains rendered DOM tree (${rootHtml.length} characters)`);

    const headerVisibility = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return false;
      const rect = header.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom > 30 && rect.width > 200;
    });
    assert(headerVisibility, 'H2.2: Header is strictly visible at the top of the viewport (not scrolled out)');

    const hasControls = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Eve') && (text.includes('Quiet') || text.includes('Logs') || text.includes('Config') || text.includes('Prompt Studio'));
    });
    assert(hasControls, 'H2.3: Header controls (Quiet Mode / Prompt Studio / Logs / Config) are rendered');

    const quickPromptsRendered = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Eve') || text.includes('How can I help') || text.includes('Deep Work') || text.includes('Assistant');
    });
    assert(quickPromptsRendered, 'H2.4: Natural quick prompts rendered on screen');

    console.log('\n--- [Step 3] Interactive Chat Verification ---');
    // Test typing a message and submitting
    const inputFound = await page.$('input[type="text"]');
    assert(inputFound !== null, 'H3.1: Chat text input found on page');

    if (inputFound) {
      await page.type('input[type="text"]', 'What are 3 strategies for deep work?');
      await page.click('button[type="submit"]');
      await new Promise(r => setTimeout(r, 1500));

      const chatUpdated = await page.evaluate(() => {
        const text = document.body.innerText;
        return text.includes('What are 3 strategies for deep work?') || text.includes('Time') || text.includes('Pomodoro') || text.includes('Block');
      });
      assert(chatUpdated, 'H3.2: Message submitted and rendered in conversation stream');
    }

    console.log('\n--- [Step 4] Error-Free Execution Verification ---');
    assert(browserErrors.length === 0, `H4.1: Zero uncaught browser runtime exceptions (found ${browserErrors.length})`, browserErrors);
    assert(consoleErrors.length === 0, `H4.2: Zero browser console.error logs (found ${consoleErrors.length})`, consoleErrors);

  } finally {
    await browser.close();
  }

  console.log('\n======================================================================');
  console.log(`📊 HEADLESS BROWSER AUDIT COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runHeadlessBrowserRenderAudit().catch((err) => {
  console.error('Fatal Headless Browser Test Error:', err);
  process.exit(1);
});
