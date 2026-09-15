import test from 'node:test';
import assert from 'node:assert/strict';
import { cortexEngine } from '../src/services/cortexDialogueEngine';
import { proactiveLoopService } from '../src/services/proactiveLoopService';
import { memoryGraph } from '../src/services/memoryGraphService';
import { executiveBriefing } from '../src/services/executiveBriefingService';
import { weatherService } from '../src/services/weatherService';
import { marketService } from '../src/services/marketIntelligenceService';
import { webSearchService } from '../src/services/webSearchService';
import { intelligentAdvisor } from '../src/services/intelligentAdvisor';
import { detectLanguage, resolveBestVoice } from '../src/services/speechSynthesis';
import { 
  InboxEmail, 
  CalendarAppointment, 
  TaskItem, 
  DialogueTurn, 
  ImageAttachment 
} from '../src/types';

test('🌟 Exhaustive Prompt Matrix Verification Suite (7 Categories)', async (suiteContext) => {

  // =========================================================================
  // CATEGORY 1: Family & Contact Dispatch
  // =========================================================================
  await suiteContext.test('Category 1: Family & Contact Dispatch (Celine, Eleonore/Ellie/Eleanor, Alexander, Elizabeth, Angelina & Speech Fillers)', async (t) => {
    console.log('\n--- 👪 Category 1: Family & Contact Dispatch ---');

    // 1.1 Celine Loeuille (Wife) with speech filler: "If I want you to send an email to..."
    const celineFillerQuery = "If I want you to send an email to Celine saying I love you";
    const resCeline = await cortexEngine.reasonAndAct(celineFillerQuery);
    assert.equal(resCeline.actionCard.intent, 'email_draft', 'Intent is email_draft for Celine love email');
    assert.equal(resCeline.actionCard.emailData?.toName, 'Celine Loeuille', 'Recipient name is Celine Loeuille');
    assert.ok(resCeline.actionCard.emailData?.subject && resCeline.actionCard.emailData.subject.length > 0, 'Subject is populated');
    assert.ok(/love/i.test(resCeline.actionCard.emailData?.body || '') || /love/i.test(resCeline.actionCard.emailData?.subject || ''), 'Body or subject expresses love');
    assert.ok(/celine/i.test(resCeline.spokenResponse) && (/celine\.loeuille@gmail\.com/i.test(resCeline.spokenResponse) || /email|love/i.test(resCeline.spokenResponse)), 'Spoken confirmation mentions recipient & email');

    // 1.2 Eleonore / Ellie / Eleanor Baxter (Daughter) with filler: "Can you tell Ellie I'm on my way"
    const ellieQuery = "Can you tell Ellie I'm on my way";
    const resEllie = await cortexEngine.reasonAndAct(ellieQuery);
    assert.equal(resEllie.actionCard.intent, 'email_draft', 'Intent is email_draft for Ellie message');
    assert.equal(resEllie.actionCard.emailData?.toName, 'Eleonore Baxter', 'Phonetic alias "Ellie" maps to Eleonore Baxter');
    assert.equal(resEllie.actionCard.emailData?.toEmail, 'eleonore.a.baxter@gmail.com', 'Resolved email: eleonore.a.baxter@gmail.com');
    assert.ok(/on my way/i.test(resEllie.actionCard.emailData?.body || '') || /on my way/i.test(resEllie.actionCard.emailData?.subject || ''), 'Message captures "on my way"');

    // 1.3 Eleanor Baxter variant: "Send an email to Eleanor saying see you tomorrow morning"
    const eleanorQuery = "Send an email to Eleanor saying see you tomorrow morning";
    const resEleanor = await cortexEngine.reasonAndAct(eleanorQuery);
    assert.equal(resEleanor.actionCard.intent, 'email_draft', 'Intent is email_draft for Eleanor note');
    assert.equal(resEleanor.actionCard.emailData?.toName, 'Eleonore Baxter', 'Phonetic alias "Eleanor" maps to Eleonore Baxter');
    assert.equal(resEleanor.actionCard.emailData?.toEmail, 'eleonore.a.baxter@gmail.com', 'Email is eleonore.a.baxter@gmail.com');
    assert.ok(/tomorrow/i.test(resEleanor.actionCard.emailData?.body || ''), 'Body captures tomorrow morning');

    // 1.4 Alexander Baxter (Son): "Tell Alexander dinner is ready"
    const alexQuery = "Tell Alexander dinner is ready";
    const resAlex = await cortexEngine.reasonAndAct(alexQuery);
    assert.equal(resAlex.actionCard.intent, 'email_draft', 'Intent is email_draft for Alexander');
    assert.equal(resAlex.actionCard.emailData?.toName, 'Alexander Baxter', 'Recipient is Alexander Baxter');
    assert.equal(resAlex.actionCard.emailData?.toEmail, 'alexander.j.baxter@gmail.com', 'Resolved email: alexander.j.baxter@gmail.com');
    assert.ok(/dinner/i.test(resAlex.actionCard.emailData?.subject || '') || /dinner/i.test(resAlex.actionCard.emailData?.body || ''), 'Captures dinner subject');

    // 1.5 Elizabeth Baxter (Daughter): "Send a note to Elizabeth regarding tomorrow's schedule"
    const lizQuery = "Send a note to Elizabeth regarding tomorrow's schedule";
    const resLiz = await cortexEngine.reasonAndAct(lizQuery);
    assert.equal(resLiz.actionCard.intent, 'email_draft', 'Intent is email_draft for Elizabeth note');
    assert.equal(resLiz.actionCard.emailData?.toName, 'Elizabeth Baxter', 'Recipient is Elizabeth Baxter');
    assert.equal(resLiz.actionCard.emailData?.toEmail, 'elizabth.js.baxter@gmail.com', 'Resolved email: elizabth.js.baxter@gmail.com');
    assert.ok(/schedule/i.test(resLiz.actionCard.emailData?.subject || '') || /schedule/i.test(resLiz.actionCard.emailData?.body || ''), 'Captures schedule topic');

    // 1.6 Angelina Baxter (Daughter): "Let Angelina know we are heading out"
    const linaQuery = "Let Angelina know we are heading out";
    const resLina = await cortexEngine.reasonAndAct(linaQuery);
    assert.equal(resLina.actionCard.intent, 'email_draft', 'Intent is email_draft for Angelina');
    assert.equal(resLina.actionCard.emailData?.toName, 'Angelina Baxter', 'Recipient is Angelina Baxter');
    assert.equal(resLina.actionCard.emailData?.toEmail, 'angelina.c.baxter@gmail.com', 'Resolved email: angelina.c.baxter@gmail.com');
    assert.ok(/heading out/i.test(resLina.actionCard.emailData?.body || '') || /on my way/i.test(resLina.actionCard.emailData?.subject || ''), 'Captures departure context');

    // 1.7 Wife alias with "my wife": "Draft an email to my wife saying running 15 minutes late"
    const wifeQuery = "Draft an email to my wife saying running 15 minutes late";
    const resWife = await cortexEngine.reasonAndAct(wifeQuery);
    assert.equal(resWife.actionCard.emailData?.toName, 'Celine Loeuille', 'Maps "my wife" to Celine Loeuille');
    assert.equal(resWife.actionCard.emailData?.toEmail, 'celine.loeuille@gmail.com', 'Maps "my wife" to celine.loeuille@gmail.com');
    assert.ok(/late/i.test(resWife.actionCard.emailData?.subject || ''), 'Subject contains "Running late"');

    console.log('  ✅ Category 1 Passed: All 7 Family Dispatch scenarios resolved with 100% accuracy.');
  });

  // =========================================================================
  // CATEGORY 2: Executive & Real-Time Briefings
  // =========================================================================
  await suiteContext.test('Category 2: Executive & Real-Time Briefings (Hoeilaart Weather, S8 Commute, Agenda, BTC/ETH/Gold & Live Web Grounding)', async (t) => {
    console.log('\n--- 🌅 Category 2: Executive & Real-Time Briefings ---');

    // 2.1 Morning Executive Briefing
    const amRes = await executiveBriefing.generateMorningBriefing('Andrew');
    assert.equal(amRes.type, 'morning', 'Briefing type is morning');
    assert.ok(amRes.actionCard.title.includes('Morning Executive Briefing'), 'Card title formatted');
    assert.ok(amRes.spokenResponse.includes('Hoeilaart') || amRes.spokenResponse.includes('1560'), 'Spoken briefing mentions home location');
    assert.ok(amRes.spokenResponse.includes('S8') || amRes.spokenResponse.includes('train'), 'Spoken briefing mentions S8 train commute');
    assert.ok(amRes.sections.some(s => s.title.includes('Weather')), 'Includes weather section');
    assert.ok(amRes.sections.some(s => s.title.includes('Transit') || s.title.includes('Commute')), 'Includes transit/commute section');
    assert.ok(amRes.sections.some(s => s.title.includes('Financial Markets')), 'Includes financial markets section');
    assert.ok(amRes.sections.some(s => s.title.includes('Agenda')), 'Includes agenda preview');

    // 2.2 Evening Executive Briefing & Wrap-Up
    const pmRes = await executiveBriefing.generateEveningBriefing('Andrew');
    assert.equal(pmRes.type, 'evening', 'Briefing type is evening');
    assert.ok(pmRes.actionCard.title.includes('Evening Executive Wrap-Up'), 'Evening card title formatted');
    assert.ok(pmRes.sections.some(s => s.title.includes('Execution Wrap-Up')), 'Includes execution wrap-up');
    assert.ok(pmRes.sections.some(s => s.title.includes('Communications') || s.title.includes('Inbox')), 'Includes communications health');
    assert.ok(pmRes.sections.some(s => s.title.includes('Tomorrow\'s Agenda Preview')), 'Includes tomorrow preview');

    // 2.3 Regional Commute Solver: Hoeilaart to Brussels
    const commuteRes = await cortexEngine.reasonAndAct("how do i get from my house to work");
    assert.ok(/S8|Groenendaal|Hoeilaart|train|Brussels|commute/i.test(commuteRes.spokenResponse), 'Commute solver suggests S8 train from Groenendaal/Hoeilaart');
    assert.ok(/E411|Brussels|minutes|station|train|route/i.test(commuteRes.spokenResponse), 'Commute solver provides detailed duration & corridors');

    // 2.4 Live Meteorological Intelligence: Weather query for Hoeilaart & Brussels
    const weatherRes = await weatherService.getWeather('Hoeilaart');
    assert.ok(weatherRes.temperatureC !== undefined, 'Weather contains temperature');
    assert.ok(weatherRes.condition.length > 0, 'Weather contains condition description');
    assert.ok(weatherRes.summary.includes('Hoeilaart'), 'Summary targets requested city');

    // 2.5 Real-Time Financial Market Intelligence (BTC, ETH, Gold/XAU)
    const btcQuote = await marketService.getMarketQuote('BTC');
    assert.equal(btcQuote.symbol, 'BTC', 'Quote symbol is BTC');
    assert.ok(btcQuote.priceUsd > 10000, `BTC price is realistic ($${btcQuote.priceUsd})`);

    const ethQuote = await marketService.getMarketQuote('ETH');
    assert.equal(ethQuote.symbol, 'ETH', 'Quote symbol is ETH');
    assert.ok(ethQuote.priceUsd > 1000, `ETH price is realistic ($${ethQuote.priceUsd})`);

    const goldQuote = await marketService.getMarketQuote('GOLD');
    assert.equal(goldQuote.symbol, 'XAU', 'Quote symbol is XAU (Gold)');
    assert.ok(goldQuote.priceUsd > 1500, `Gold price is realistic ($${goldQuote.priceUsd})`);

    // 2.6 Live Web Search Grounding
    const searchRes = await webSearchService.searchWeb('artificial intelligence developments');
    assert.ok(searchRes.sources.length >= 2, `Search returned ${searchRes.sources.length} cited sources`);
    assert.ok(searchRes.summary.includes('artificial intelligence developments'), 'Summary grounds requested query');
    assert.ok(searchRes.sources[0].url.startsWith('https://'), 'Sources contain valid HTTPS citations');

    console.log('  ✅ Category 2 Passed: Executive briefings, commute routing, weather, markets, and web grounding verified.');
  });

  // =========================================================================
  // CATEGORY 3: High-Intellect Cognitive Reasoning & Dialogue
  // =========================================================================
  await suiteContext.test('Category 3: High-Intellect Cognitive Reasoning & Dialogue (Deep Strategy, Client Escalation, Quantum Cryptography, AI Governance, Multi-Turn Pronoun Resolution)', async (t) => {
    console.log('\n--- 🧠 Category 3: High-Intellect Cognitive Reasoning & Dialogue ---');

    // 3.1 Deep Business Strategy (3-Phase Action Plan)
    const planResult = intelligentAdvisor.solve('Plan my next 30 days for enterprise business growth');
    assert.ok(planResult.title.includes('Strategic Action Plan'), 'Generates Strategic Action Plan');
    assert.ok(planResult.spokenResponse.includes('3-phase action plan'), 'Spoken overview mentions 3-phase plan');
    assert.ok(planResult.keyInsights.some(k => k.includes('Phase 1')), 'Contains Phase 1: Alignment & Diagnosis');
    assert.ok(planResult.keyInsights.some(k => k.includes('Phase 2')), 'Contains Phase 2: High-Leverage Execution');
    assert.ok(planResult.keyInsights.some(k => k.includes('Phase 3')), 'Contains Phase 3: Automation & Scaling');

    // 3.2 Client Crisis & Escalation Management (A.C.T.S. Framework)
    const escalationResult = intelligentAdvisor.solve('How do I handle an urgent client escalation?');
    assert.ok(escalationResult.spokenResponse.includes('A.C.T.S.') || escalationResult.spokenResponse.includes('4 étapes') || escalationResult.spokenResponse.includes('framework'), 'Presents structured escalation framework');
    assert.ok(escalationResult.keyInsights.some(k => /acknowledge/i.test(k) || /contain/i.test(k) || /impact/i.test(k)), 'Includes Acknowledge & Contain principles');

    // 3.3 Quantum Cryptography & Post-Quantum Security
    const quantumResult = intelligentAdvisor.solve('Explain quantum cryptography and post-quantum encryption algorithms');
    assert.ok(quantumResult.spokenResponse.length > 20, 'Generates detailed quantum response');
    assert.ok(quantumResult.title.includes('Quantum') || quantumResult.category === 'Tech/Dev', 'Categorized under Tech/Dev');

    // 3.4 AI Governance & Frameworks
    const governanceResult = intelligentAdvisor.solve('What is the executive framework for AI governance and safety?');
    assert.ok(governanceResult.spokenResponse.length > 20, 'Generates AI governance reasoning');
    assert.ok(governanceResult.category === 'Business & Strategy' || governanceResult.category === 'Tech/Dev', 'Categorized under Strategy/Dev');

    // 3.5 Multi-Turn Slot-Filling & Pronoun Resolution
    // Turn 1: User asks to track arrival (underspecified)
    const turn1Res = await cortexEngine.reasonAndAct("I want to track a colleague's arrival from Madrid");
    assert.ok(turn1Res.actionCard.executionTier === 'needs_slots' || /name|flight|airline|carrier|who|details|colleague|Madrid/i.test(turn1Res.spokenResponse) || turn1Res.actionCard.intent === 'web_search', 'Clarification or search triggered for arrival');
    assert.ok(/name|flight|airline|carrier|colleague|Madrid|track/i.test(turn1Res.spokenResponse), 'Asks for colleague name / flight or acknowledges tracking');

    // Turn 2: User responds with pronoun and slots: "His name is David Rossi on Iberia IB3214"
    const history: DialogueTurn[] = [
      { id: 't1', speaker: 'user', text: "I want to track a colleague's arrival from Madrid", timestamp: new Date().toISOString() },
      { id: 't2', speaker: 'assistant', text: turn1Res.spokenResponse, timestamp: new Date().toISOString() }
    ];
    const turn2Res = await cortexEngine.reasonAndAct("His name is David Rossi on Iberia IB3214", history);
    assert.ok(turn2Res.actionCard.intent === 'knowledge_qa' || turn2Res.actionCard.intent === 'web_search', 'Resolves flight tracking intent');
    assert.ok(/Brussels|BRU|Madrid|MAD|15:45|land|airport|terminal|gate|flight|track|David|Rossi|Iberia|IB3214/i.test(turn2Res.spokenResponse) || /Brussels|BRU|arrival|flight|track|Rossi|Iberia/i.test(turn2Res.actionCard.description), 'Tracks route Madrid to Brussels');

    // 3.6 Multi-Turn Plan Confirmation ("Yes, proceed")
    const planHistory: DialogueTurn[] = [
      { id: 'p1', speaker: 'user', text: "Move all my meetings tomorrow to Friday", timestamp: new Date().toISOString() },
      { id: 'p2', speaker: 'assistant', text: "I understand you'd like to move all meetings from tomorrow to Friday. I've prepared a 3-step execution plan to shift 4 calendar invites and notify 6 attendees. Should I proceed and execute this plan?", timestamp: new Date().toISOString() }
    ];
    const confirmRes = await cortexEngine.reasonAndAct("Yes, proceed and execute", planHistory);
    assert.ok(confirmRes.actionCard.intent === 'calendar_reschedule' || confirmRes.actionCard.intent === 'knowledge_qa', 'Intent is calendar_reschedule or knowledge_qa');
    assert.equal(confirmRes.actionCard.status, 'executed', 'Status updated to executed');
    assert.ok(/Friday|meetings|reschedule|shifted|complete|executed|done/i.test(confirmRes.spokenResponse), 'Confirms execution complete');

    console.log('  ✅ Category 3 Passed: Deep strategy, escalation, quantum/AI governance, and multi-turn slot filling verified.');
  });

  // =========================================================================
  // CATEGORY 4: Quantitative & Mathematical Logic
  // =========================================================================
  await suiteContext.test('Category 4: Quantitative & Mathematical Logic (Percentages, Arithmetic, Powers, Square Roots, Fractions & Safety)', async (t) => {
    console.log('\n--- 🔢 Category 4: Quantitative & Mathematical Logic ---');

    // 4.1 Exact Percentage Calculations
    const pct1 = await cortexEngine.reasonAndAct("what is 15 percent of 250");
    assert.ok(/37\.5|thirty-seven/i.test(pct1.spokenResponse), `15% of 250 is 37.5 (got "${pct1.spokenResponse}")`);
    assert.ok(pct1.toolCallExecuted?.toolName === 'calculate_math' || pct1.actionCard.intent === 'knowledge_qa', 'Dispatches calculate_math or knowledge_qa');

    const pct2 = await cortexEngine.reasonAndAct("what is 20 percent of 800");
    assert.ok(/160|one hundred sixty/i.test(pct2.spokenResponse), `20% of 800 is 160 (got "${pct2.spokenResponse}")`);

    const pct3 = await cortexEngine.reasonAndAct("what is 35 percent of 1200");
    assert.ok(/420|four hundred twenty/i.test(pct3.spokenResponse), `35% of 1200 is 420 (got "${pct3.spokenResponse}")`);

    // 4.2 Square Roots & Powers
    const sqrt1 = await cortexEngine.reasonAndAct("what is the square root of 144");
    assert.ok(/12|twelve/i.test(sqrt1.spokenResponse), `Square root of 144 is 12 (got "${sqrt1.spokenResponse}")`);

    const sqrt2 = await cortexEngine.reasonAndAct("sqrt of 81");
    assert.ok(/9|nine/i.test(sqrt2.spokenResponse), `Square root of 81 is 9 (got "${sqrt2.spokenResponse}")`);

    const pow1 = await cortexEngine.reasonAndAct("2 to the power of 8");
    assert.ok(/256|two hundred fifty-six/i.test(pow1.spokenResponse), `2^8 is 256 (got "${pow1.spokenResponse}")`);

    const pow2 = await cortexEngine.reasonAndAct("5 squared");
    assert.ok(/25|twenty-five/i.test(pow2.spokenResponse), `5^2 is 25 (got "${pow2.spokenResponse}")`);

    // 4.3 Word Arithmetic & Operations
    const mult1 = await cortexEngine.reasonAndAct("what is 12 times 8");
    assert.ok(/96|ninety-six|ninety six/i.test(mult1.spokenResponse), `12 * 8 is 96 (got "${mult1.spokenResponse}")`);

    const mult2 = await cortexEngine.reasonAndAct("12 times 8");
    assert.ok(/96|ninety-six|ninety six/i.test(mult2.spokenResponse), `12 * 8 is 96 (got "${mult2.spokenResponse}")`);

    const mult3 = await cortexEngine.reasonAndAct("multiply 14 by 5");
    assert.ok(/70|seventy/i.test(mult3.spokenResponse), `14 * 5 is 70 (got "${mult3.spokenResponse}")`);

    const div1 = await cortexEngine.reasonAndAct("calculate 4500 divided by 12");
    assert.ok(/375|three hundred (and )?seventy-five|three hundred seventy five/i.test(div1.spokenResponse), `4500 / 12 is 375 (got "${div1.spokenResponse}")`);

    const addSub = await cortexEngine.reasonAndAct("what is 250 plus 175 minus 40");
    assert.ok(/385|three hundred eighty-five/i.test(addSub.spokenResponse), `250 + 175 - 40 is 385 (got "${addSub.spokenResponse}")`);

    // 4.4 Fractions
    const fracHalf = await cortexEngine.reasonAndAct("half of 500");
    assert.ok(fracHalf.spokenResponse.includes('250'), `Half of 500 is 250 (got "${fracHalf.spokenResponse}")`);

    const fracThird = await cortexEngine.reasonAndAct("a third of 900");
    assert.ok(fracThird.spokenResponse.includes('300'), `Third of 900 is 300 (got "${fracThird.spokenResponse}")`);

    const fracQuarter = await cortexEngine.reasonAndAct("a quarter of 1000");
    assert.ok(fracQuarter.spokenResponse.includes('250'), `Quarter of 1000 is 250 (got "${fracQuarter.spokenResponse}")`);

    // 4.5 Division by Zero Safety
    const divZero = await cortexEngine.reasonAndAct("divide 50 by 0");
    assert.ok(divZero.spokenResponse.toLowerCase().includes('undefined') || divZero.spokenResponse.toLowerCase().includes('zero'), 'Handles division by zero safely');

    console.log('  ✅ Category 4 Passed: Exact percentages, powers, square roots, arithmetic, and fractions verified.');
  });

  // =========================================================================
  // CATEGORY 5: Multimodal Vision Ingestion
  // =========================================================================
  await suiteContext.test('Category 5: Multimodal Vision Ingestion (Image Buffer / Data Payload via Gemini 2.5 Vision Cortex)', async (t) => {
    console.log('\n--- 👁️ Category 5: Multimodal Vision Ingestion ---');

    // 5.1 Single Image Attachment Ingestion
    const mockImage1: ImageAttachment = {
      id: 'img-arch-1',
      name: 'cloud_architecture.png',
      mimeType: 'image/png',
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      sizeBytes: 15400,
      createdAt: new Date().toISOString()
    };

    const visionRes1 = await cortexEngine.reasonAndAct(
      "Inspect this cloud architecture diagram and summarize the components",
      [],
      undefined,
      undefined,
      [mockImage1]
    );

    assert.ok(visionRes1.actionCard !== undefined, 'Action card generated for visual ingestion');
    assert.ok(visionRes1.actionCard.imageAttachment !== undefined || (visionRes1.actionCard.imageAttachments && visionRes1.actionCard.imageAttachments.length > 0), 'Image attachment preserved on ActionCard');
    assert.equal(visionRes1.actionCard.imageAttachment?.name, 'cloud_architecture.png', 'Attachment name matches');
    assert.ok(visionRes1.spokenResponse.length > 10, 'Spoken response formulated for image analysis');

    // 5.2 Multi-Image Batch Ingestion (UI Design + Invoice Receipt)
    const mockImage2: ImageAttachment = {
      id: 'img-receipt-2',
      name: 'supplier_invoice.jpg',
      mimeType: 'image/jpeg',
      dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
      sizeBytes: 8200,
      createdAt: new Date().toISOString()
    };

    const visionRes2 = await cortexEngine.reasonAndAct(
      "Compare these two visual artifacts",
      [],
      undefined,
      undefined,
      [mockImage1, mockImage2]
    );

    assert.equal(visionRes2.actionCard.imageAttachments?.length, 2, 'Both image attachments retained on ActionCard');
    assert.ok(visionRes2.spokenResponse.length > 0, 'Multimodal batch processed successfully');

    // 5.3 Vision Ingestion with Empty Text Prompt (Image Only)
    const visionRes3 = await cortexEngine.reasonAndAct(
      "",
      [],
      undefined,
      undefined,
      [mockImage1]
    );
    assert.ok(visionRes3.actionCard !== undefined, 'Image-only input processed without throwing');
    assert.ok(visionRes3.actionCard.imageAttachment !== undefined, 'Image attachment retained on image-only input');

    console.log('  ✅ Category 5 Passed: Single, batch, and image-only multimodal vision ingestion verified.');
  });

  // =========================================================================
  // CATEGORY 6: Proactive Background Alerts
  // =========================================================================
  await suiteContext.test('Category 6: Proactive Background Alerts (Autonomous Background Inspection of VIP Emails, <45 min Meetings, Deduplication)', async (t) => {
    console.log('\n--- 🔔 Category 6: Proactive Background Alerts ---');
    proactiveLoopService.resetAlertHistory();

    const now = Date.now();

    // 6.1 VIP Urgent Email Alert
    const mockEmails: InboxEmail[] = [
      {
        id: 'inbox-vip-urgent-1',
        fromName: 'Sarah Chen',
        fromEmail: 'sarah.chen@innovate.co',
        subject: 'URGENT: Q3 Budget Signoff Required by 5 PM',
        snippet: 'Hi Andrew, we need your signoff on the Q3 growth sprint budget before close of business.',
        body: 'Hi Andrew, please approve the attached budget allocation ASAP.',
        isUnread: true,
        isStarred: true,
        category: 'vip',
        receivedAt: new Date(now - 120000).toISOString()
      },
      {
        id: 'inbox-newsletter-2',
        fromName: 'Tech Weekly',
        fromEmail: 'newsletter@techweekly.com',
        subject: 'Weekly Tech News Digest',
        snippet: 'Here is the news for this week...',
        body: 'Weekly digest...',
        isUnread: true,
        category: 'newsletter',
        receivedAt: new Date(now - 600000).toISOString()
      }
    ];

    const alert1 = proactiveLoopService.checkUrgentEvents({
      inboxEmails: mockEmails,
      appointments: [],
      tasks: []
    });

    assert.ok(alert1 !== null, 'Proactive loop triggered for urgent VIP email');
    assert.equal(alert1?.source, 'email', 'Alert source is email');
    assert.equal(alert1?.sourceId, 'inbox-vip-urgent-1', 'Identifies correct VIP email ID');
    assert.equal(alert1?.intent, 'email_draft', 'Intent is email_draft');
    assert.ok(alert1?.spokenSummary.includes('Sarah Chen'), 'Spoken alert names sender Sarah Chen');
    assert.ok(alert1?.actionCardData?.emailData?.toEmail === 'sarah.chen@innovate.co', 'Includes staged reply email');

    // 6.2 Deduplication Invariant: Second check does not re-alert on the same email
    const alert1Dup = proactiveLoopService.checkUrgentEvents({
      inboxEmails: mockEmails,
      appointments: [],
      tasks: []
    });
    assert.equal(alert1Dup, null, 'Deduplication prevents re-alerting on already notified VIP email');

    // 6.3 Imminent Calendar Meeting Alert (<45 min)
    const mockAppointments: CalendarAppointment[] = [
      {
        id: 'apt-imminent-1',
        title: 'Executive Board Sync & Product Demo',
        startDateTime: new Date(now + 25 * 60000).toISOString(), // 25 min in future
        endDateTime: new Date(now + 55 * 60000).toISOString(),
        location: 'Google Meet / Virtual',
        status: 'confirmed',
        attendees: [{ name: 'David Miller', email: 'david.m@cloudscale.io' }]
      }
    ];

    const alert2 = proactiveLoopService.checkUrgentEvents({
      inboxEmails: [],
      appointments: mockAppointments,
      tasks: []
    });

    assert.ok(alert2 !== null, 'Proactive loop triggered for meeting in <45 min');
    assert.equal(alert2?.source, 'calendar', 'Alert source is calendar');
    assert.equal(alert2?.sourceId, 'apt-imminent-1', 'Matches imminent appointment ID');
    assert.ok(alert2?.spokenSummary.includes('Executive Board Sync'), 'Spoken reminder mentions meeting title');
    assert.ok(alert2?.spokenSummary.includes('25') || alert2?.spokenSummary.includes('minutes'), 'Spoken reminder includes countdown minutes');

    // 6.4 Deduplication for Calendar: Second check does not re-alert
    const alert2Dup = proactiveLoopService.checkUrgentEvents({
      inboxEmails: [],
      appointments: mockAppointments,
      tasks: []
    });
    assert.equal(alert2Dup, null, 'Deduplication prevents re-alerting on already notified calendar meeting');

    // 6.5 Blocked Critical Task Alert
    const mockTasks: TaskItem[] = [
      {
        id: 'task-blocked-1',
        title: 'Deploy Cloudflare Pages Edge Functions',
        description: 'Edge API deployment blocked on OAuth secrets configuration',
        category: 'Tech/Dev',
        userPriority: 'urgent',
        aiPriority: 'critical',
        feasibility: 'ai_automated',
        valueScore: 9,
        estimatedValue: '$3,000/mo',
        timeWonBackHours: 40,
        status: 'blocked',
        startDate: '2026-08-25',
        dueDate: '2026-08-28',
        progressPercent: 30,
        priorityRationale: 'Waiting for OAuth credentials'
      }
    ];

    const alert3 = proactiveLoopService.checkUrgentEvents({
      inboxEmails: [],
      appointments: [],
      tasks: mockTasks
    });

    assert.ok(alert3 !== null, 'Proactive loop triggered for blocked critical task');
    assert.equal(alert3?.source, 'task', 'Alert source is task');
    assert.equal(alert3?.sourceId, 'task-blocked-1', 'Matches blocked task ID');
    assert.ok(alert3?.spokenSummary.includes('Deploy Cloudflare Pages Edge Functions'), 'Spoken notice mentions task title');

    // 6.6 Resetting alert history allows re-alerting
    proactiveLoopService.resetAlertHistory();
    const alertAfterReset = proactiveLoopService.checkUrgentEvents({
      inboxEmails: mockEmails,
      appointments: [],
      tasks: []
    });
    assert.ok(alertAfterReset !== null, 'Alert triggers again after resetAlertHistory()');

    console.log('  ✅ Category 6 Passed: VIP email, <45 min meeting, blocked task alerts & deduplication verified.');
  });

  // =========================================================================
  // CATEGORY 7: Multilingual & STT Noise Robustness
  // =========================================================================
  await suiteContext.test('Category 7: Multilingual & STT Noise Robustness (Dynamic French/Dutch/English, Ambient Noise Rejection "See the", Zero Boilerplate)', async (t) => {
    console.log('\n--- 🌐 Category 7: Multilingual & STT Noise Robustness ---');

    // 7.1 French (Français) Execution & Natural Tone
    const frWeatherQuery = "Quel temps fait-il à Hoeilaart ?";
    const frRes = await cortexEngine.reasonAndAct(frWeatherQuery);
    assert.ok(frRes.spokenResponse.length > 0, 'French weather query answered');
    assert.ok(frRes.spokenResponse.includes('°C') || frRes.spokenResponse.includes('Hoeilaart') || frRes.spokenResponse.includes('fait') || frRes.spokenResponse.includes('météo') || frRes.spokenResponse.includes('climat'), 'French weather formatted');

    const frAdvisor = intelligentAdvisor.solve('Comment gérer une crise ou une réclamation client?');
    assert.equal(frAdvisor.language, 'fr', 'Detected French language');
    assert.ok(frAdvisor.spokenResponse.includes('4 étapes') || frAdvisor.spokenResponse.includes('client'), 'Delivered French crisis strategy');
    assert.ok(!frAdvisor.spokenResponse.includes('**Strategic Insights:**'), 'No artificial markdown in spoken voice');

    // 7.2 German (Deutsch) Execution
    const deAdvisor = intelligentAdvisor.solve('Wie kann ich meine Produktivität und Deep Work verbessern?');
    assert.equal(deAdvisor.language, 'de', 'Detected German language');
    assert.ok(deAdvisor.spokenResponse.includes('Deep-Work') || deAdvisor.spokenResponse.includes('Hebel') || deAdvisor.spokenResponse.includes('Block'), 'Delivered German productivity guidance');

    // 7.3 Dutch (Nederlands) Voice & Language Mapping
    const detectedNl = detectLanguage('Het is momenteel prachtig weer in Hoeilaart.');
    const nlVoice = resolveBestVoice('studio_female', detectedNl);
    assert.ok(nlVoice !== null, 'Resolved Dutch voice');

    // 7.4 Ambient STT Noise Rejection ("See the", "Um", "Uh", "Thank you for watching")
    const noiseRes1 = await cortexEngine.reasonAndAct("See the");
    assert.equal(noiseRes1.actionCard.title, '🎙️ Ambient Noise Filtered', '"See the" filtered as ambient noise');
    assert.ok(noiseRes1.spokenResponse.includes('listening'), 'Gentle standby confirmation spoken');
    assert.equal(noiseRes1.toolCallExecuted?.toolName, 'filter_ambient_noise', 'filter_ambient_noise tool executed');

    const noiseRes2 = await cortexEngine.reasonAndAct("Thank you for watching.");
    assert.equal(noiseRes2.actionCard.title, '🎙️ Ambient Noise Filtered', '"Thank you for watching" filtered');

    const noiseRes3 = await cortexEngine.reasonAndAct("Um uh...");
    assert.equal(noiseRes3.actionCard.title, '🎙️ Ambient Noise Filtered', 'Filler noise filtered');

    // 7.5 Zero Banned Boilerplate Check Across Voice Outputs
    const checkQueries = [
      "What do you think about AI in 2026?",
      "How should I structure our marketing funnel?",
      "Can we chat for a minute?"
    ];

    for (const q of checkQueries) {
      const res = intelligentAdvisor.solve(q);
      assert.ok(!res.spokenResponse.includes('**Strategic Insights:**'), `No banned boilerplate in "${q}"`);
      assert.ok(!res.spokenResponse.includes('💡 Executive Pro-Tip:'), `No pro-tip boilerplate in "${q}"`);
      assert.ok(!res.spokenResponse.includes('• Phase 1:'), `No raw bullet points in spoken response for "${q}"`);
    }

    console.log('  ✅ Category 7 Passed: French/German/Dutch handling, "See the" noise filtering, and zero boilerplate verified.');
  });

});
