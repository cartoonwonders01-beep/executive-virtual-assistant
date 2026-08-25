import test from 'node:test';
import assert from 'node:assert/strict';

if (typeof (global as any).localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

import { googleEcosystem } from '../server/googleEcosystem';
import { antigravityBridge } from '../server/antigravityBridge';
import { skillRegistry, parseSkillFromSpeech } from '../server/skillRegistry';
import { db } from '../server/db';

test('Antigravity Suite Bridge, Google Ecosystem & Self-Learning Engine Suite', async (t) => {

  await t.test('Module 1: Google Ecosystem Connector generates Google Meet link and Calendar URL', () => {
    const start = new Date(Date.now() + 86400000).toISOString();
    const end = new Date(Date.now() + 90000000).toISOString();
    
    const res = googleEcosystem.createGoogleCalendarEvent(
      'Strategic Architecture Sync with David',
      start,
      end,
      [{ name: 'David Miller', email: 'david.miller@apex.io' }],
      'Google Meet Virtual Bridge'
    );

    assert.ok(res.event.id.startsWith('apt-'), 'Calendar event generated unique ID');
    assert.ok(res.googleMeetUrl.includes('meet.google.com'), 'Generated valid Google Meet URL');
    assert.ok(res.googleCalendarUrl.includes('calendar.google.com'), 'Generated Google Calendar direct web URL');
    assert.equal(res.event.attendees[0].email, 'david.miller@apex.io');
  });

  await t.test('Module 2: Google Ecosystem syncs thoughts and tasks to Sheets & BigQuery warehouse', async () => {
    const tasks = db.getTasks();
    const thoughts = [
      {
        id: 'th-test-1',
        content: 'Protect morning deep work and automate email triage with AI swarm',
        category: 'Productivity',
        executiveSummary: 'Morning Deep Work Protocol',
        keyInsights: ['Insight 1', 'Insight 2'],
        actionSteps: ['Step 1', 'Step 2'],
        googleSyncStatus: 'synced' as const,
        antigravityExported: true,
        createdAt: new Date().toISOString()
      }
    ];

    const kpi = {
      totalHoursWonBack: 776,
      automationHoursInvested: 135.5,
      netROIHours: 640.5,
      roiMultiplier: 5.7,
      totalTasks: tasks.length,
      completedTasks: 2,
      ongoingTasks: 44,
      backlogTasks: 3,
      aiAutomatedCount: 42,
      humanOnlyCount: 4,
      hybridCount: 3,
      highValueCount: 49,
      completionRatePercent: 4
    };

    const res = await googleEcosystem.syncToSheetsAndBigQuery(thoughts, tasks, kpi);
    assert.equal(res.service, 'sheets');
    assert.equal(res.status, 'synced');
    assert.ok(res.recordsAffected >= 1);
    assert.ok(res.summary.includes('BigQuery'));
  });

  await t.test('Module 3: Antigravity Bridge compiles voice-learned skill to standard SKILL.md format', () => {
    const speech = "When I say 'Executive Triage', triage my inbox, check my calendar, and summarize high-priority tasks";
    const parsed = parseSkillFromSpeech(speech);
    assert.ok(parsed, 'Parsed skill from voice transcript');

    const created = skillRegistry.createSkill(parsed!);
    const exported = antigravityBridge.exportToAntigravitySkill(created);

    assert.equal(exported.skillName, 'executive-triage');
    assert.equal(exported.skillPath, '.agents/skills/executive-triage/SKILL.md');
    assert.ok(exported.skillContent.includes('---'), 'Contains YAML frontmatter');
    assert.ok(exported.skillContent.includes('name: executive-triage'));
    assert.ok(exported.skillContent.includes('Autonomous Execution Rules'));
    assert.ok(exported.skillContent.includes('sandbox-vm'));
    assert.ok(exported.ruleContent?.includes('When the user mentions "executive triage"'));
  });

  await t.test('Module 4: Antigravity Bridge creates Sandbox VM execution payload per AGENTS.md protocol', () => {
    const tasks = db.getTasks();
    const sampleTask = tasks[0];

    const job = antigravityBridge.createSandboxExecutionJob(sampleTask, sampleTask.automationBlueprint);
    assert.ok(job.id.startsWith('job-vm-'), 'Assigned unique VM job ID');
    assert.equal(job.targetEnvironment, 'sandbox-vm');
    assert.ok(job.outputLogs.some(l => l.includes('Air-Gapped Sandbox Protocol Active')));
    assert.ok(job.outputLogs.some(l => l.includes('10.211.55.6')));
  });

  await t.test('Module 5: Live GUI Activity Logger records telemetry events and supports filtering', async () => {
    const { logger } = await import('../src/services/loggerService');
    
    logger.log('info', 'wake_word', 'Test wake-word listener initialized');
    logger.log('success', 'wake_word', '🎯 Test Wake-Word DETECTED: "Hey Eve"');
    logger.log('info', 'speech_stt', 'Live STT: "What are 3 strategies for deep work?"');
    logger.log('success', 'ai_reasoning', 'Intent resolved to [knowledge_qa]: 3 Strategies for Deep Work');
    logger.log('info', 'tts_speech', 'Speaking aloud response to user');

    const entries = logger.getEntries();
    assert.ok(entries.length >= 5, 'Logger captured all 5 events');
    assert.equal(entries[0].category, 'tts_speech');
    assert.equal(entries[0].level, 'info');

    const successEntries = entries.filter(e => e.level === 'success');
    assert.ok(successEntries.length >= 2, 'Filtered success level entries');
  });

  await t.test('Module 6: Human-Like Conversational Intelligence & Small Talk Solver', async () => {
    const { intelligentAdvisor } = await import('../server/intelligentAdvisor');

    // 1. Small talk: "How are you?"
    const ans1 = intelligentAdvisor.solve('How are you doing today?');
    assert.ok(ans1.spokenResponse.includes('doing fantastic'), 'Responds warmly to small talk');

    // 2. Humor: "Tell me a joke"
    const ans2 = intelligentAdvisor.solve('Tell me a joke');
    assert.ok(ans2.spokenResponse.length > 10, 'Delivers punchy humor');

    // 3. Meaning of life
    const ans3 = intelligentAdvisor.solve('What is the meaning of life?');
    assert.ok(ans3.spokenResponse.includes('meaning of life'), 'Provides philosophical depth');

    // 4. Executive Strategy
    const ans4 = intelligentAdvisor.solve('How do I handle a difficult client escalation?');
    assert.ok(ans4.spokenResponse.includes('A.C.T.S.'), 'Provides structured executive framework');
  });

  await t.test('Module 7: Relay Configuration & Tuning Engine handles audio slices, bitrates & persistence', async () => {
    const config = await import('../src/config');
    
    assert.equal(config.DEFAULT_CHUNK_INTERVAL_MS, 2000);
    assert.equal(config.DEFAULT_AUDIO_BITRATE_KBPS, 64);
    assert.equal(config.DEFAULT_SILENCE_DURATION_MS, 350);
    assert.ok(config.AUDIO_BITRATE_OPTIONS.length >= 3, 'Provides bitrate options');
    assert.equal(config.APP_VERSION, '4.1.0');
    assert.ok(config.LANGUAGE_OPTIONS.length >= 8, 'Provides European language options');
  });

  await t.test('Module 8: Live Interactive Transcript, Quiet Mode & Dialogue Stream', async () => {
    const { dialogueManager } = await import('../src/services/dialogueManager');
    
    dialogueManager.clearTurns();
    assert.equal(dialogueManager.getTurns().length, 0, 'Dialogue turns cleared');

    const turn1 = dialogueManager.addTurn('user', 'What are 3 strategies for deep work?');
    assert.equal(turn1.speaker, 'user');
    assert.equal(turn1.text, 'What are 3 strategies for deep work?');

    const turn2 = dialogueManager.addTurn('assistant', 'Here are 3 core strategies: 1) Time blocking, 2) Digital isolation, 3) Pomodoro intervals.', 'knowledge_qa');
    assert.equal(turn2.speaker, 'assistant');
    assert.equal(turn2.intent, 'knowledge_qa');

    const turns = dialogueManager.getTurns();
    assert.equal(turns.length, 2, '2 turns registered in dialogue stream');
  });

  await t.test('Module 9: Multilingual European Language Detection & Native Personas', async () => {
    const { detectLanguage, resolveBestVoice } = await import('../src/services/speechSynthesis');
    const { intelligentAdvisor } = await import('../server/intelligentAdvisor');

    // Language detection
    assert.equal(detectLanguage('What are 3 strategies for deep work?'), 'en');
    assert.equal(detectLanguage('Was sind 3 Strategien für eine produktive Morgenroutine?'), 'de');
    assert.equal(detectLanguage('Quelles sont les stratégies pour le travail profond ?'), 'fr');
    assert.equal(detectLanguage('¿Cuáles son 3 estrategias para el trabajo profundo?'), 'es');
    assert.equal(detectLanguage('Quali sono le strategie per il lavoro profondo?'), 'it');
    assert.equal(detectLanguage('Wat zijn 3 strategieën voor deep work?'), 'nl');
    assert.equal(detectLanguage('Jakie są strategie na głęboką pracę?'), 'pl');
    assert.equal(detectLanguage('Quais são as estratégias para o trabalho profundo?'), 'pt');

    // Multilingual Intelligent Advisor Answers
    const deAns = intelligentAdvisor.solve('Was sind Strategien für Deep Work?');
    assert.equal(deAns.language, 'de');
    assert.ok(deAns.spokenResponse.includes('Deep-Work-Block') || deAns.spokenResponse.includes('Hebel'));

    const frAns = intelligentAdvisor.solve('Quelles sont les stratégies pour le travail profond ?');
    assert.equal(frAns.language, 'fr');
    assert.ok(frAns.spokenResponse.includes('travail profond') || frAns.spokenResponse.includes('stratégique'));

    const esAns = intelligentAdvisor.solve('¿Cuáles son las estrategias de productividad?');
    assert.equal(esAns.language, 'es');
    assert.ok(esAns.spokenResponse.includes('trabajo profundo') || esAns.spokenResponse.includes('rendimiento'));
  });

  await t.test('Module 10: Continuous Memory & Adaptive Self-Learning Engine', async () => {
    const { selfLearningEngine } = await import('../src/services/selfLearningEngine');

    // Detection of memory instructions
    assert.ok(selfLearningEngine.isMemoryInstruction('Eve, remember that my favorite meeting tool is Google Meet'));
    assert.ok(selfLearningEngine.isMemoryInstruction('Merk dir, dass Andrew gerne Espresso trinkt'));
    assert.ok(selfLearningEngine.isMemoryInstruction('Rappelle-toi que le client préfère les rapports PDF'));
    assert.ok(selfLearningEngine.isMemoryInstruction('Recuerda que Emily ama las flores'));

    // Fact saving & extraction
    const memory = selfLearningEngine.extractAndSaveMemory('Remember that my preferred meeting tool is Google Meet');
    assert.ok(memory.id.startsWith('ins-'));
    assert.ok(memory.insight.includes('Google Meet'));
    assert.equal(memory.confidenceScore, 1.0);

    // Feedback recording
    selfLearningEngine.recordFeedback('turn-test-1', true);
    selfLearningEngine.recordFeedback('turn-test-2', false, 'Too verbose');
    const insights = selfLearningEngine.getInsights();
    assert.ok(insights.length >= 4, 'Learned insights tracked');
  });

  await t.test('Module 11: Continuous Listening Inactivity Timeout & Persona Framing Architecture', async () => {
    const { 
      getStoredContinuousTimeoutSeconds, 
      storeContinuousTimeoutSeconds, 
      getStoredPersonaStyle, 
      storePersonaStyle, 
      getStoredPersonaPrompt, 
      storePersonaPrompt, 
      PERSONA_PRESETS,
      CONTINUOUS_TIMEOUT_OPTIONS
    } = await import('../src/config');

    // Continuous listening timeout defaults to 60s
    assert.equal(getStoredContinuousTimeoutSeconds(), 60);
    storeContinuousTimeoutSeconds(120);
    assert.equal(getStoredContinuousTimeoutSeconds(), 120);
    storeContinuousTimeoutSeconds(60); // reset

    // Continuous timeout options include 30s, 60s, 120s, 300s, and manual only (0)
    assert.ok(CONTINUOUS_TIMEOUT_OPTIONS.some(o => o.value === 60));
    assert.ok(CONTINUOUS_TIMEOUT_OPTIONS.some(o => o.value === 0));

    // Persona presets & high-IQ executive peer default
    assert.equal(getStoredPersonaStyle(), 'executive_peer');
    assert.ok(PERSONA_PRESETS.executive_peer.prompt.includes('executive advisor'));
    assert.ok(PERSONA_PRESETS.strategic_cofounder.prompt.includes('co-founder'));
    assert.ok(PERSONA_PRESETS.concise_operator.prompt.includes('1 to 3 punchy sentences'));
    assert.ok(PERSONA_PRESETS.pm_director.prompt.includes('technical director'));

    // Custom prompt persistence
    const testCustomPrompt = 'You are Eve, speaking with executive clarity and zero corporate boilerplate.';
    storePersonaPrompt(testCustomPrompt);
    assert.equal(getStoredPersonaPrompt(), testCustomPrompt);
  });

  await t.test('Module 12: LLM Prompt Studio & Multi-User Persona Customizer Engine', async () => {
    const { 
      getStoredLLMProfiles, 
      storeLLMProfiles, 
      getActiveLLMProfile, 
      storeActiveLLMProfileId, 
      buildUnifiedSystemPrompt,
      DEFAULT_LLM_PROFILES 
    } = await import('../src/config');

    // Default profiles loaded
    const profiles = getStoredLLMProfiles();
    assert.ok(profiles.length >= 4, 'Loaded default LLM profiles');
    assert.ok(profiles.some(p => p.id === 'prof-executive-lead'));
    assert.ok(profiles.some(p => p.id === 'prof-cofounder'));
    assert.ok(profiles.some(p => p.id === 'prof-operator'));
    assert.ok(profiles.some(p => p.id === 'prof-architect'));

    // Active profile resolution
    const active = getActiveLLMProfile();
    assert.ok(active.id.length > 0);
    assert.equal(active.userContext.userName, 'Andrew');
    assert.ok(active.userContext.strategicGoals.length > 0);

    // Unified prompt builder combines system prompt, user profile context, and behavioral rules
    const unifiedPrompt = buildUnifiedSystemPrompt(active);
    assert.ok(unifiedPrompt.includes('ABOUT THE USER (YOU ARE ASSISTING):'));
    assert.ok(unifiedPrompt.includes('Andrew'));
    assert.ok(unifiedPrompt.includes('Strategic Goals:'));
    assert.ok(unifiedPrompt.includes('MODEL TEMPERATURE:'));

    // Custom profile creation and switching
    const customUser: any = {
      id: 'prof-user-sarah',
      name: 'Sarah (Venture Partner)',
      description: 'VC investor and portfolio strategist',
      systemPrompt: 'You are Eve, evaluating deal flow and portfolio unit economics.',
      userContext: {
        userName: 'Sarah',
        userRole: 'General Partner',
        organization: 'A100 Ventures',
        strategicGoals: ['Evaluate Series A pipeline', 'Support founders'],
        communicationRules: ['High-signal memo formatting']
      },
      model: 'gemini-1.5-pro',
      temperature: 0.8,
      tone: 'thought_partner',
      responseVerbosity: 'balanced',
      customInstructions: 'Prioritize ARR growth benchmarks.'
    };

    storeLLMProfiles([...profiles, customUser]);
    storeActiveLLMProfileId('prof-user-sarah');

    const sarahActive = getActiveLLMProfile();
    assert.equal(sarahActive.id, 'prof-user-sarah');
    assert.equal(sarahActive.userContext.userName, 'Sarah');

    const sarahUnified = buildUnifiedSystemPrompt(sarahActive);
    assert.ok(sarahUnified.includes('User Name: Sarah'));
    assert.ok(sarahUnified.includes('General Partner'));
    assert.ok(sarahUnified.includes('A100 Ventures'));
  });

  await t.test('Module 13: Multi-User Family Memory & Speaker Auto-Recognition Engine', async () => {
    const { 
      DEFAULT_LLM_PROFILES, 
      detectSpeakerFromTranscript,
      getProfileDialogueStorageKey,
      getProfileInsightsStorageKey
    } = await import('../src/config');

    // Family profiles exist
    assert.ok(DEFAULT_LLM_PROFILES.some(p => p.id === 'prof-celine'), 'Celine family profile exists');
    assert.ok(DEFAULT_LLM_PROFILES.some(p => p.id === 'prof-elizabeth'), 'Elizabeth profile exists');
    assert.ok(DEFAULT_LLM_PROFILES.some(p => p.id === 'prof-alexander'), 'Alexander profile exists');
    assert.ok(DEFAULT_LLM_PROFILES.some(p => p.id === 'prof-eleonore'), 'Eleonore profile exists');
    assert.ok(DEFAULT_LLM_PROFILES.some(p => p.id === 'prof-angelina'), 'Angelina profile exists');

    // Speaker auto-detection
    const detectedCeline = detectSpeakerFromTranscript("Bonjour Eve, c'est Celine, pourrais-tu vérifier le planning familial?", DEFAULT_LLM_PROFILES);
    assert.ok(detectedCeline, 'Recognized Celine from voice greeting');
    assert.equal(detectedCeline?.userContext.userName, 'Celine');

    const detectedAndrew = detectSpeakerFromTranscript("Hey Eve, Andrew here, what are my morning priorities?", DEFAULT_LLM_PROFILES);
    assert.ok(detectedAndrew, 'Recognized Andrew from voice greeting');
    assert.equal(detectedAndrew?.userContext.userName, 'Andrew');

    const detectedLiz = detectSpeakerFromTranscript("Hi Eve, this is Elizabeth, help me with creative writing", DEFAULT_LLM_PROFILES);
    assert.ok(detectedLiz, 'Recognized Elizabeth from voice greeting');
    assert.equal(detectedLiz?.userContext.userName, 'Elizabeth');

    // Partitioned storage keys
    const celineStorageKey = getProfileDialogueStorageKey('prof-celine');
    const andrewStorageKey = getProfileDialogueStorageKey('prof-executive-lead');
    assert.notEqual(celineStorageKey, andrewStorageKey, 'Different users have isolated conversation histories');
    assert.equal(celineStorageKey, 'assistant_dialogue_turns_prof-celine');
  });

});
