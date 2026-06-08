/**
 * app.js — Entry point do Agent Office (modo coordinator com canvas pixel art).
 *
 * Fluxo:
 *  1. Canvas inicializa via office.js → scene.js
 *  2. GET /api/agents confirma que o backend está vivo
 *  3. Conecta ao WebSocket
 *  4. Todas as mensagens são enviadas para o agente "coordinator"
 *  5. Backend emite active_agent → personagem ilumina no canvas
 *  6. Clicar numa personagem preenche o input com "Usa o agente [nome]"
 *  7. Chip de próximo agente aparece quando output contém "➡ Próximo agente:"
 */

import { createWSClient } from "./ws.js";
import { createOffice }   from "./office.js";
import { createChat }     from "./chat.js";

// --- Elementos DOM --------------------------------------------------------- //

const officeCanvasEl     = document.getElementById("office-canvas");
const messagesEl         = document.getElementById("messages");
const messageInput       = document.getElementById("message-input");
const sendBtn            = document.getElementById("send-btn");
const activeAgentIcon    = document.getElementById("active-agent-icon");
const activeAgentName    = document.getElementById("active-agent-name");
const agentModelEl       = document.getElementById("agent-model");
const agentStateEl       = document.getElementById("agent-state");
const wsStatusEl         = document.getElementById("ws-status");
const inputForm          = document.getElementById("input-form");

// --- Estado da aplicação --------------------------------------------------- //

const COORDINATOR = "coordinator";

let currentAgent    = COORDINATOR;  // sempre coordinator no envio WS
let activeSubAgent  = null;         // agente activo indicado pelo backend
let isWaiting       = false;
let currentSessionId = null;        // guardado pelo ws.js internamente (via getSessionId)

// --- Módulos --------------------------------------------------------------- //

const office = createOffice(officeCanvasEl, handleCanvasAgentClick);

const chat = createChat(messagesEl, {
  onNewSession:           handleNewSession,
  onNextAgentSuggestion:  handleNextAgentSuggestion,
});

const ws = createWSClient({
  onSessionId:      handleSessionId,
  onChunk:          handleChunk,
  onDone:           handleDone,
  onError:          handleWsError,
  onSessionExpired: handleSessionExpired,
  onStateChange:    handleWsStateChange,
  onActiveAgent:    handleActiveAgent,
});

// --- WebSocket: callbacks -------------------------------------------------- //

function handleSessionId(sessionId) {
  currentSessionId = sessionId;
  console.debug("[app] session_id recebido:", sessionId);
}

function handleChunk(text) {
  chat.appendChunk(text);
}

function handleDone() {
  chat.finalizeMessage();
  setWaiting(false);

  // Quando a resposta termina, a personagem activa volta ao estado normal
  if (activeSubAgent) {
    office.setAgentThinking(activeSubAgent, false);
    office.setActiveAgent(activeSubAgent);
  }
}

function handleWsError(message) {
  chat.showError(message);
  setWaiting(false);
  if (activeSubAgent) office.setAgentThinking(activeSubAgent, false);
}

function handleSessionExpired(agent) {
  const meta = office.getAgentMeta(agent || COORDINATOR);
  chat.showSessionExpired(agent, meta.label);
  setWaiting(false);
  if (activeSubAgent) office.setAgentThinking(activeSubAgent, false);
}

/**
 * Evento active_agent — o backend indica qual subagente está a processar.
 * Ilumina a personagem no canvas e actualiza o header.
 *
 * @param {string} agentName
 */
function handleActiveAgent(agentName) {
  if (!agentName) return;

  // Desactiva o agente anterior
  if (activeSubAgent && activeSubAgent !== agentName) {
    office.setAgentThinking(activeSubAgent, false);
  }

  activeSubAgent = agentName;
  office.setActiveAgent(agentName);
  office.setAgentThinking(agentName, true);

  // Actualiza header
  const meta = office.getAgentMeta(agentName);
  if (activeAgentIcon) activeAgentIcon.textContent = meta.icon;
  if (activeAgentName) activeAgentName.textContent = meta.label;
  if (agentStateEl) {
    agentStateEl.textContent = "a pensar...";
    agentStateEl.className = "thinking";
  }

  console.debug("[app] Agente activo:", agentName);
}

function handleWsStateChange(state) {
  if (wsStatusEl) wsStatusEl.className = state;

  const statusLabel = wsStatusEl?.querySelector?.('#ws-status-label');

  switch (state) {
    case "connected":
      if (statusLabel) statusLabel.textContent = "Ligado";
      if (wsStatusEl) wsStatusEl.title = "Ligado";
      enableInput();
      break;
    case "connecting":
      if (statusLabel) statusLabel.textContent = "A ligar...";
      if (wsStatusEl) wsStatusEl.title = "A ligar...";
      disableInput();
      break;
    case "disconnected":
      if (statusLabel) statusLabel.textContent = "Desligado";
      if (wsStatusEl) wsStatusEl.title = "Desligado";
      disableInput();
      break;
  }
}

// --- Clique numa personagem no canvas -------------------------------------- //

/**
 * Quando o utilizador clica numa personagem no canvas,
 * preenche o input com "Usa o agente [nome]" mas NÃO envia automaticamente.
 * O utilizador confirma antes de enviar.
 *
 * @param {string} agentName
 */
function handleCanvasAgentClick(agentName) {
  if (isWaiting) return;

  const meta = office.getAgentMeta(agentName);
  messageInput.value = `Usa o agente ${meta.label}`;
  messageInput.focus();

  // Posiciona o cursor no final do texto
  const len = messageInput.value.length;
  messageInput.setSelectionRange(len, len);

  // Auto-resize
  messageInput.style.height = "auto";
  messageInput.style.height = messageInput.scrollHeight + "px";
}

// --- Sugestão de próximo agente -------------------------------------------- //

/**
 * Chamado quando o utilizador clica no chip de próximo agente.
 * Preenche o input com a instrução — utilizador confirma antes de enviar.
 *
 * @param {string} agentName
 */
function handleNextAgentSuggestion(agentName) {
  if (isWaiting) return;

  const meta = office.getAgentMeta(agentName);
  messageInput.value = `Usa o agente ${meta.label}`;
  messageInput.focus();

  const len = messageInput.value.length;
  messageInput.setSelectionRange(len, len);

  messageInput.style.height = "auto";
  messageInput.style.height = messageInput.scrollHeight + "px";
}

// --- Nova sessão (após session_expired) ------------------------------------ //

function handleNewSession(_agent) {
  ws.resetSession();
  currentSessionId = null;
  console.info("[app] Sessão resetada");
}

// --- Envio de mensagem ----------------------------------------------------- //

if (inputForm) {
  inputForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendUserMessage();
  });
}

if (messageInput) {
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  });

  // Auto-resize da textarea
  messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";
    messageInput.style.height = messageInput.scrollHeight + "px";
  });
}

function sendUserMessage() {
  const content = messageInput.value.trim();
  if (!content) return;
  if (isWaiting) return;

  // Envia sempre para o coordinator
  const sent = ws.sendMessage(COORDINATOR, content, ws.getSessionId());
  if (!sent) return;

  // Renderiza mensagem do utilizador no chat
  chat.appendUserMessage(content);

  // Inicia balão de streaming (agente coordinator até active_agent chegar)
  const displayAgent = activeSubAgent || COORDINATOR;
  const meta = office.getAgentMeta(displayAgent);
  chat.startAssistantMessage(displayAgent, meta.color, meta.label);

  setWaiting(true);

  messageInput.value = "";
  messageInput.style.height = "auto";
}

// --- Utilitários de estado ------------------------------------------------- //

function setWaiting(waiting) {
  isWaiting = waiting;

  if (waiting) {
    disableInput();
    if (agentStateEl) {
      agentStateEl.textContent = "a pensar...";
      agentStateEl.className = "thinking";
    }
  } else {
    enableInput();
    if (agentStateEl) {
      agentStateEl.textContent = activeSubAgent ? "activo" : "idle";
      agentStateEl.className = activeSubAgent ? "" : "idle";
    }
  }
}

function enableInput() {
  if (messageInput) {
    messageInput.disabled = false;
    messageInput.setAttribute("placeholder",
      "Escreve uma mensagem... (Enter envia, Shift+Enter nova linha)"
    );
  }
  if (sendBtn) sendBtn.disabled = false;
}

function disableInput() {
  if (messageInput) messageInput.disabled = true;
  if (sendBtn) sendBtn.disabled = true;
}

// --- Fetch helper ---------------------------------------------------------- //

async function apiFetch(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status} em ${path}`);
  return res.json();
}

// --- Bootstrap ------------------------------------------------------------- //

async function init() {
  // Actualiza header com estado inicial
  if (activeAgentName) activeAgentName.textContent = "coordinator";
  if (agentModelEl) agentModelEl.textContent = "claude-sonnet-4-6";
  if (agentStateEl) {
    agentStateEl.textContent = "idle";
    agentStateEl.className = "idle";
  }

  // Confirmar que o backend está acessível
  try {
    await apiFetch("/api/agents");
    console.info("[app] Backend acessível");
  } catch (err) {
    console.warn("[app] Backend não acessível:", err.message);
    chat.showError(
      "Não foi possível ligar ao backend. " +
      "Certifica-te de que o servidor está a correr em localhost:8000"
    );
  }

  // Activa o input (o WebSocket conecta automaticamente no createWSClient)
  enableInput();
  if (messageInput) messageInput.focus();
}

// Aguarda DOM pronto (módulos ES já são diferidos, mas é explícito para clareza)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
