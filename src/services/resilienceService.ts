// Self-Healing Feedback & Error Recovery Loop (SHF-ERL)
// Industry-Leading Voice Assistant Resilience & Graceful Degradation Engine

import { logger } from './loggerService';
import { detectLanguage, SupportedLanguage } from './speechSynthesis';

export type ErrorSeverity = 'recoverable' | 'degraded' | 'critical';

export type AssistantErrorCategory = 
  | 'LLM_CLOUD_TIMEOUT'
  | 'LLM_QUOTA_EXCEEDED'
  | 'NETWORK_OFFLINE'
  | 'MIC_PERMISSION_DENIED'
  | 'STT_RECOGNITION_FAILED'
  | 'TOOL_EXECUTION_ERROR'
  | 'GENERIC_EXCEPTION';

export interface RecoveryAction {
  id: string;
  category: AssistantErrorCategory;
  severity: ErrorSeverity;
  userMessage: string;
  spokenExplanation: string;
  fallbackStrategyUsed: string;
  suggestedAction?: string;
  timestamp: string;
}

export class ResilienceService {
  private static instance: ResilienceService;
  private recentRecoveries: RecoveryAction[] = [];

  private constructor() {}

  public static getInstance(): ResilienceService {
    if (!ResilienceService.instance) {
      ResilienceService.instance = new ResilienceService();
    }
    return ResilienceService.instance;
  }

  /**
   * Evaluates an error, selects an automatic fallback strategy, and generates a natural spoken explanation
   */
  public handleAssistantError(
    category: AssistantErrorCategory,
    errorDetails: any,
    userQuery: string = '',
    targetLang?: SupportedLanguage
  ): RecoveryAction {
    const lang = targetLang || detectLanguage(userQuery);
    const now = new Date().toISOString();
    const id = 'rec-' + Date.now().toString(36);

    let severity: ErrorSeverity = 'recoverable';
    let fallbackStrategy = 'Local Cognitive Engine';
    let userMessage = '';
    let spokenExplanation = '';
    let suggestedAction = '';

    switch (category) {
      case 'LLM_CLOUD_TIMEOUT':
      case 'LLM_QUOTA_EXCEEDED':
        severity = 'recoverable';
        fallbackStrategy = 'Local Cognitive Semantic Solver';
        if (lang === 'fr') {
          spokenExplanation = "J'ai rencontré une brève latence avec le modèle distant, mais je prends le relais immédiatement avec mon moteur local pour vous répondre.";
          userMessage = "⚠️ Latence modèle cloud — Basculement automatique sur le moteur sémantique local.";
          suggestedAction = "Vérifiez votre clé API Gemini si le problème persiste.";
        } else if (lang === 'de') {
          spokenExplanation = "Es gab eine kurze Verzögerung beim Cloud-Modell. Ich bearbeite Ihre Anfrage direkt mit der lokalen Engine weiter.";
          userMessage = "⚠️ Cloud-Modell Timeout — Automatische Übergabe an die lokale Cognitive Engine.";
          suggestedAction = "Prüfen Sie ggf. Ihren Gemini API-Schlüssel.";
        } else if (lang === 'es') {
          spokenExplanation = "He experimentado un pequeño retraso con el servicio en la nube, pero continúo con el motor local ahora mismo.";
          userMessage = "⚠️ Timeout del modelo cloud — Recuperación automática con motor local.";
          suggestedAction = "Comprueba tu clave de API si esto se repite.";
        } else {
          spokenExplanation = "I ran into a brief connection delay with the cloud model, so I'm handling your request with my local engine right away.";
          userMessage = "⚠️ Cloud LLM Latency — Automatically recovered via local cognitive engine.";
          suggestedAction = "Check your Gemini API key if this persists.";
        }
        break;

      case 'NETWORK_OFFLINE':
        severity = 'degraded';
        fallbackStrategy = 'Offline Knowledge Base';
        if (lang === 'fr') {
          spokenExplanation = "Vous semblez être hors ligne. Je bascule en mode local autonome.";
          userMessage = "📡 Réseau indisponible — Fonctionnement en mode local hors-ligne.";
          suggestedAction = "Vérifiez votre connexion internet.";
        } else if (lang === 'de') {
          spokenExplanation = "Sie scheinen offline zu sein. Ich wechsle in den lokalen Offline-Modus.";
          userMessage = "📡 Netzwerk offline — Lokaler Offline-Modus aktiviert.";
          suggestedAction = "Prüfen Sie Ihre Internetverbindung.";
        } else if (lang === 'es') {
          spokenExplanation = "Parece que no hay conexión a internet. He activado el modo local fuera de línea.";
          userMessage = "📡 Red fuera de línea — Modo autónomo local activado.";
          suggestedAction = "Verifica tu conexión a internet.";
        } else {
          spokenExplanation = "It looks like you're offline. I've switched to local offline mode to assist you.";
          userMessage = "📡 Network Offline — Operating in local offline mode.";
          suggestedAction = "Check your internet connection.";
        }
        break;

      case 'MIC_PERMISSION_DENIED':
        severity = 'critical';
        fallbackStrategy = 'Text Input Mode';
        if (lang === 'fr') {
          spokenExplanation = "L'accès au microphone n'a pas pu être établi. Vous pouvez utiliser la saisie texte ci-dessous.";
          userMessage = "🎙️ Accès microphone refusé — Activez le micro dans les paramètres du navigateur.";
          suggestedAction = "Autorisez le microphone dans la barre d'adresse de Chrome.";
        } else if (lang === 'de') {
          spokenExplanation = "Der Mikrofonzugriff wurde blockiert. Sie können Text unten eingeben.";
          userMessage = "🎙️ Mikrofon-Berechtigung verweigert — Bitte im Browser aktivieren.";
          suggestedAction = "Mikrofon in den Browsereinstellungen erlauben.";
        } else if (lang === 'es') {
          spokenExplanation = "No se pudo acceder al micrófono. Puedes escribir tu mensaje en el campo inferior.";
          userMessage = "🎙️ Permiso de micrófono denegado — Habilítalo en el navegador.";
          suggestedAction = "Permite el micrófono en la barra del navegador.";
        } else {
          spokenExplanation = "Microphone access was blocked. You can still type in the input bar below.";
          userMessage = "🎙️ Microphone Access Denied — Please allow mic permissions in your browser.";
          suggestedAction = "Allow microphone permissions in your browser address bar.";
        }
        break;

      case 'TOOL_EXECUTION_ERROR':
        severity = 'recoverable';
        fallbackStrategy = 'Safe State Rollback';
        if (lang === 'fr') {
          spokenExplanation = "L'action demandée a rencontré un imprévu. J'ai sécurisé votre session sans modifier vos données.";
          userMessage = "⚙️ Erreur d'exécution de l'outil — État sécurisé sans impact.";
          suggestedAction = "Essayez de reformuler votre demande.";
        } else if (lang === 'de') {
          spokenExplanation = "Die Aktion konnte nicht vollständig ausgeführt werden. Ihre Daten sind unverändert geblieben.";
          userMessage = "⚙️ Tool-Ausführungsfehler — Sicherer Zustand wiederhergestellt.";
          suggestedAction = "Bitte formulieren Sie die Anfrage neu.";
        } else if (lang === 'es') {
          spokenExplanation = "La acción encontró un inconveniente. He asegurado tus datos sin cambios.";
          userMessage = "⚙️ Error al ejecutar la herramienta — Estado seguro mantenido.";
          suggestedAction = "Intenta reformular tu instrucción.";
        } else {
          spokenExplanation = "I ran into a hitch executing that action. I've preserved your data safely without changes.";
          userMessage = "⚙️ Tool Execution Glitch — Safely maintained state without changes.";
          suggestedAction = "Try rephrasing your command.";
        }
        break;

      default:
        severity = 'recoverable';
        fallbackStrategy = 'Executive Dialogue Fallback';
        if (lang === 'fr') {
          spokenExplanation = "J'ai rencontré une petite difficulté, mais je reste à votre entière disposition. Que souhaitez-vous faire ?";
          userMessage = "ℹ️ Récupération automatique effectuée.";
        } else if (lang === 'de') {
          spokenExplanation = "Ein kleiner Fehler ist aufgetreten, aber ich bin voll einsatzbereit. Was möchten Sie als Nächstes tun?";
          userMessage = "ℹ️ Automatische Wiederherstellung erfolgreich.";
        } else if (lang === 'es') {
          spokenExplanation = "Ocurrió un pequeño inconveniente, pero sigo lista. ¿Qué deseas hacer ahora?";
          userMessage = "ℹ️ Recuperación automática completada.";
        } else {
          spokenExplanation = "I encountered a minor glitch, but I'm right here with you. What would you like to do next?";
          userMessage = "ℹ️ Assistant automatically recovered from unexpected event.";
        }
        break;
    }

    const recovery: RecoveryAction = {
      id,
      category,
      severity,
      userMessage,
      spokenExplanation,
      fallbackStrategyUsed: fallbackStrategy,
      suggestedAction,
      timestamp: now
    };

    this.recentRecoveries.unshift(recovery);
    if (this.recentRecoveries.length > 20) this.recentRecoveries.pop();

    logger.log('warn', 'ai_reasoning', `🛡️ [SHF-ERL Self-Healing] ${category} -> Fallback: ${fallbackStrategy}`, {
      errorDetails: String(errorDetails),
      spokenExplanation
    });

    return recovery;
  }

  public getRecentRecoveries(): RecoveryAction[] {
    return [...this.recentRecoveries];
  }
}

export const resilienceService = ResilienceService.getInstance();
