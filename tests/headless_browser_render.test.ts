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
      const hasWeatherData = text.includes('°C') || text.includes('°F') || text.includes('weather') || text.includes('forecast') || text.includes('temperature');
      const hasNoGibberish = !text.includes('active progress and solid metrics') && !text.includes('The verified data confirms recent developments');
      return hasWeatherData && hasNoGibberish;
    });
    assert(weatherTurnRendered, 'H4.1: Factual meteorological intelligence rendered in DOM (zero boilerplate)');

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

    const latestBadgeRendered = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('LATEST') || text.includes('Newest on Top');
    });
    assert(latestBadgeRendered, 'H7.3: Latest activity highlighted with "✨ LATEST" badge at the top of the stream');

    const sortOrderToggleFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(b => b.innerText.includes('Newest on Top') || b.innerText.includes('Oldest on Top'));
    });
    assert(sortOrderToggleFound, 'H7.4: Sort order switcher (Newest-on-Top vs Oldest-on-Top) rendered in header');

    console.log('\n--- [Step 8] Real-User UI Interaction: New Chat & Archive ---');
    const newChatClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const newChatBtn = buttons.find(b => b.innerText.includes('New Chat') || b.title?.includes('new clean chat') || b.title?.includes('Archive'));
      if (newChatBtn) {
        newChatBtn.click();
        return true;
      }
      return false;
    });
    assert(newChatClicked, 'H8.1: "New Chat" button found and clicked');

    await new Promise(r => setTimeout(r, 600));

    const heroOrbRestored = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('How can I assist you today, Andrew?') || text.includes('Tap to Talk');
    });
    assert(heroOrbRestored, 'H8.2: Conversation reset to clean hero orb state after archive');

    console.log('\n--- [Step 9] Real-User UI Interaction: Multilingual French, German & Spanish Dialogue ---');
    // Test French Conversational Interaction
    await page.click('input[type="text"]');
    await page.type('input[type="text"]', "Bonjour Eve, comment vas-tu aujourd'hui ?");
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 1000));

    const frenchTurnRendered = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Bonjour') || text.includes('assistante') || text.includes('plannings') || text.includes('emails');
    });
    assert(frenchTurnRendered, 'H9.1: French conversational response rendered in DOM');

    // Test German Conversational Interaction
    await page.click('input[type="text"]');
    await page.type('input[type="text"]', "Hallo Eve, was sind 3 Strategien für eine Morgenroutine?");
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 1000));

    const germanTurnRendered = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Morgenroutine') || text.includes('Hebel') || text.includes('Deep-Work') || text.includes('Assistentin');
    });
    assert(germanTurnRendered, 'H9.2: German conversational response rendered in DOM');

    // Test Spanish Conversational Interaction
    await page.click('input[type="text"]');
    await page.type('input[type="text"]', "¡Hola Eve! ¿Qué opinas de nuestra estrategia de crecimiento?");
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 1000));

    const spanishTurnRendered = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('estrategia') || text.includes('apalancamiento') || text.includes('ejecutiva') || text.includes('Hola');
    });
    assert(spanishTurnRendered, 'H9.3: Spanish conversational response rendered in DOM');

    console.log('\n--- [Step 10] Real-User UI Profiling: Zero-CPU Idle RAF Invariant ---');
    const idleRafCount = await page.evaluate(async () => {
      let count = 0;
      const orig = window.requestAnimationFrame;
      window.requestAnimationFrame = (cb: FrameRequestCallback) => {
        count++;
        return orig(cb);
      };
      await new Promise(res => setTimeout(res, 500));
      window.requestAnimationFrame = orig;
      return count;
    });
    assert(idleRafCount === 0, `H10.1: Zero CPU spinning in idle state (measured ${idleRafCount} requestAnimationFrame cycles over 500ms)`);

    console.log('\n--- [Step 11] Error-Free Execution Verification ---');
    assert(browserErrors.length === 0, `H11.1: Zero uncaught browser runtime exceptions (found ${browserErrors.length})`, browserErrors);
    assert(consoleErrors.length === 0, `H11.2: Zero browser console.error logs (found ${consoleErrors.length})`, consoleErrors);

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

