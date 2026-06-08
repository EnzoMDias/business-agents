/**
 * chat.js — Módulo de renderização do chat (mensagens, streaming, erros, histórico).
 *
 * Exporta: createChat(messagesEl, callbacks)
 *
 * Novidades:
 *  - showNextAgentSuggestion(agentName, reason) — chip clicável de próximo agente
 *  - Detecção automática de "➡ Próximo agente: /agent <nome>" no texto recebido
 *  - Badges com nome do agente activo em cada mensagem
 */

// --------------------------------------------------------------------------- //

/**
 * Formata um timestamp ISO 8601 para hora local legível (HH:MM).
 *
 * @param {string|null} iso
 * @returns {string}
 */
function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/**
 * Escapa HTML para evitar XSS ao inserir conteúdo de texto em innerHTML.
 * Usado apenas para dados vindos do utilizador inseridos em atributos.
 * O conteúdo das mensagens é tratado via textContent.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeAttr(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// --------------------------------------------------------------------------- //

// Regex para detectar sugestão de próximo agente no output do coordinator
const NEXT_AGENT_RE = /➡\s*Próximo agente:\s*\/agent\s+([\w_]+)/i;

/**
 * Cria e gere a área de chat.
 *
 * @param {HTMLElement} messagesEl   - #messages
 * @param {object} [callbacks]
 * @param {(agent: string) => void} callbacks.onNewSession
 * @param {(agent: string) => void} [callbacks.onNextAgentSuggestion]
 *
 * @returns {{
 *   appendUserMessage,
 *   startAssistantMessage,
 *   appendChunk,
 *   finalizeMessage,
 *   showError,
 *   showSessionExpired,
 *   showNextAgentSuggestion,
 *   loadHistory,
 *   clearMessages,
 * }}
 */
export function createChat(messagesEl, callbacks = {}) {
  const {
    onNewSession = () => {},
    onNextAgentSuggestion = () => {},
  } = callbacks;

  /** Referência para o balão em construção durante streaming */
  let activeStreamBubble = null;
  /** Referência para o elemento .message em construção */
  let activeStreamMessage = null;

  // --- Utilitário: scroll automático -------------------------------------- //

  function _scrollToBottom() {
    // requestAnimationFrame garante que o DOM está pintado antes de fazer scroll
    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  // --- Utilitário: ocultar/mostrar placeholder ---------------------------- //

  function _updateEmpty() {
    const emptyEl = messagesEl.querySelector("#messages-empty");
    if (!emptyEl) return;
    // Conta mensagens reais (exclui o placeholder)
    const hasMessages = messagesEl.querySelector(".message, .message-error, .session-expired-notice");
    emptyEl.setAttribute("aria-hidden", hasMessages ? "true" : "false");
    emptyEl.style.display = hasMessages ? "none" : "";
  }

  // --- API pública -------------------------------------------------------- //

  /**
   * Adiciona uma mensagem do utilizador ao chat.
   *
   * @param {string} content
   */
  function appendUserMessage(content) {
    _hideEmpty();

    const el = document.createElement("article");
    el.className = "message user";
    el.setAttribute("role", "article");
    el.setAttribute("aria-label", "A tua mensagem");

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = content;

    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.innerHTML = `<span class="meta-time">${formatTime(new Date().toISOString())}</span>`;

    el.appendChild(meta);
    el.appendChild(bubble);
    messagesEl.appendChild(el);

    _scrollToBottom();
    _updateEmpty();
  }

  /**
   * Cria um balão vazio para streaming do assistente.
   * Subsequentes chamadas a appendChunk preenchem este balão.
   *
   * @param {string} agent      - Nome do agente
   * @param {string} agentColor - Cor CSS do agente (ex: "var(--color-architect)")
   * @param {string} agentLabel - Label legível do agente
   */
  function startAssistantMessage(agent, agentColor, agentLabel) {
    _hideEmpty();

    const el = document.createElement("article");
    el.className = "message assistant streaming";
    el.setAttribute("role", "article");
    el.setAttribute("aria-label", `Resposta de ${agentLabel ?? agent}`);
    el.setAttribute("data-agent", agent);
    el.style.setProperty("--agent-color", agentColor ?? "var(--accent-blue)");

    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.innerHTML = `
      <span class="meta-agent" style="color: ${agentColor ?? "inherit"}">${escapeAttr(agentLabel ?? agent)}</span>
      <span class="meta-time">${formatTime(new Date().toISOString())}</span>
    `;

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = "";

    el.appendChild(meta);
    el.appendChild(bubble);
    messagesEl.appendChild(el);

    activeStreamMessage = el;
    activeStreamBubble  = bubble;

    _scrollToBottom();
    _updateEmpty();
  }

  /**
   * Acrescenta texto ao balão de streaming em construção.
   *
   * @param {string} text
   */
  function appendChunk(text) {
    if (!activeStreamBubble) return;
    activeStreamBubble.textContent += text;
    _scrollToBottom();
  }

  /**
   * Finaliza a mensagem em streaming (remove cursor piscante).
   * Analisa o conteúdo final à procura de sugestão de próximo agente.
   */
  function finalizeMessage() {
    if (activeStreamMessage) {
      activeStreamMessage.classList.remove("streaming");

      // Detectar sugestão de próximo agente no texto completo
      const bubble = activeStreamMessage.querySelector(".message-bubble");
      if (bubble) {
        const fullText = bubble.textContent || "";
        const match = fullText.match(NEXT_AGENT_RE);
        if (match) {
          const suggestedAgent = match[1].toLowerCase();
          showNextAgentSuggestion(suggestedAgent, "");
        }
      }
    }
    activeStreamMessage = null;
    activeStreamBubble  = null;
  }

  /**
   * Mostra o chip de sugestão de próximo agente.
   * Chamado automaticamente pelo finalizeMessage() quando detecta o padrão,
   * ou pode ser chamado directamente pelo app.js.
   *
   * @param {string} agentName - nome do agente sugerido
   * @param {string} [reason]  - motivo (opcional, não exibido actualmente)
   */
  function showNextAgentSuggestion(agentName, reason = "") {
    _hideEmpty();

    // Evita duplicar chips para o mesmo agente
    const existing = messagesEl.querySelector(`.next-agent-chip[data-agent="${agentName}"]`);
    if (existing) return;

    const el = document.createElement("div");
    el.className = "next-agent-chip";
    el.setAttribute("data-agent", agentName);

    const label = agentName.replace(/_/g, " ");
    el.innerHTML = `
      <span class="chip-arrow">&#10145;</span>
      <span class="chip-text">Próximo:</span>
      <button class="agent-chip-btn" type="button" data-agent="${escapeAttr(agentName)}">
        ${escapeAttr(label)}
      </button>
    `;

    el.querySelector(".agent-chip-btn").addEventListener("click", () => {
      onNextAgentSuggestion(agentName);
      el.remove();
    });

    messagesEl.appendChild(el);
    _scrollToBottom();
    _updateEmpty();
  }

  /**
   * Mostra uma mensagem de erro inline no chat.
   *
   * @param {string} message
   */
  function showError(message) {
    _hideEmpty();

    const el = document.createElement("div");
    el.className = "message-error";
    el.setAttribute("role", "alert");
    el.innerHTML = `
      <span class="error-icon" aria-hidden="true">&#9888;&#65039;</span>
      <span class="error-text"></span>
    `;
    el.querySelector(".error-text").textContent = message;
    messagesEl.appendChild(el);

    _scrollToBottom();
    _updateEmpty();
  }

  /**
   * Mostra aviso de sessão expirada com botão "Nova sessão".
   *
   * @param {string} agent
   * @param {string} agentLabel
   */
  function showSessionExpired(agent, agentLabel) {
    _hideEmpty();

    const el = document.createElement("div");
    el.className = "session-expired-notice";
    el.setAttribute("role", "alert");
    el.setAttribute("aria-live", "assertive");

    el.innerHTML = `
      <div class="notice-header">
        <span aria-hidden="true">&#9888;&#65039;</span>
        <span>Sessão de ${escapeAttr(agentLabel ?? agent)} expirou</span>
      </div>
      <p class="notice-body">
        O contexto anterior não está disponível. Podes iniciar uma nova sessão
        (sem histórico) ou ignorar este aviso.
      </p>
      <div class="notice-actions">
        <button class="btn-new-session" type="button">Nova sessão</button>
        <button class="btn-dismiss" type="button">Ignorar</button>
      </div>
    `;

    el.querySelector(".btn-new-session").addEventListener("click", () => {
      el.remove();
      onNewSession(agent);
    });

    el.querySelector(".btn-dismiss").addEventListener("click", () => {
      el.remove();
    });

    messagesEl.appendChild(el);
    _scrollToBottom();
    _updateEmpty();
  }

  /**
   * Carrega o histórico de mensagens de uma sessão.
   *
   * @param {Array<{role: string, content: string, agent: string, timestamp: string}>} messages
   * @param {string} agentColor
   * @param {string} agentLabel
   */
  function loadHistory(messages, agentColor, agentLabel) {
    clearMessages();
    if (!messages || messages.length === 0) return;

    messages.forEach((msg) => {
      if (msg.role === "user") {
        appendUserMessage(msg.content);
      } else if (msg.role === "assistant") {
        // Cria mensagem finalizada (sem streaming)
        const el = document.createElement("article");
        el.className = "message assistant";
        el.setAttribute("role", "article");
        el.setAttribute("aria-label", `Resposta de ${agentLabel ?? msg.agent}`);
        el.setAttribute("data-agent", msg.agent);
        el.style.setProperty("--agent-color", agentColor ?? "var(--accent-blue)");

        const meta = document.createElement("div");
        meta.className = "message-meta";
        meta.innerHTML = `
          <span class="meta-agent" style="color: ${agentColor ?? "inherit"}">${escapeAttr(agentLabel ?? msg.agent)}</span>
          <span class="meta-time">${formatTime(msg.timestamp)}</span>
        `;

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.textContent = msg.content;

        el.appendChild(meta);
        el.appendChild(bubble);
        messagesEl.appendChild(el);
      }
    });

    _scrollToBottom();
    _updateEmpty();
  }

  /**
   * Remove todas as mensagens do chat.
   */
  function clearMessages() {
    // Preserva o placeholder #messages-empty
    const emptyEl = messagesEl.querySelector("#messages-empty");
    messagesEl.innerHTML = "";
    if (emptyEl) messagesEl.appendChild(emptyEl);
    activeStreamBubble  = null;
    activeStreamMessage = null;
    _updateEmpty();
  }

  // --- Utilitários privados ----------------------------------------------- //

  function _hideEmpty() {
    const emptyEl = messagesEl.querySelector("#messages-empty");
    if (emptyEl) emptyEl.style.display = "none";
  }

  return {
    appendUserMessage,
    startAssistantMessage,
    appendChunk,
    finalizeMessage,
    showError,
    showSessionExpired,
    showNextAgentSuggestion,
    loadHistory,
    clearMessages,
  };
}
