/**
 * ws.js — Módulo WebSocket com reconexão automática e gestão de session_id.
 *
 * Exporta: createWSClient(callbacks) → { sendMessage, disconnect, resetSession, getSessionId }
 *
 * Protocolo:
 *  Envio:   { type: "message", content: string, agent: string, session_id: string|null }
 *  Recepção: { type: "session_id"|"chunk"|"done"|"error"|"session_expired"|"active_agent", ... }
 */

const WS_URL        = "ws://localhost:8000/ws";
const MAX_RETRIES   = 3;
const BASE_DELAY_MS = 1000; // backoff: 1s, 2s, 4s

/**
 * Cria e gere uma ligação WebSocket.
 *
 * @param {object} callbacks
 * @param {(sessionId: string) => void}         callbacks.onSessionId
 * @param {(text: string, agent: string) => void} callbacks.onChunk
 * @param {() => void}                           callbacks.onDone
 * @param {(message: string) => void}            callbacks.onError
 * @param {(agent: string) => void}              callbacks.onSessionExpired
 * @param {(state: "connecting"|"connected"|"disconnected") => void} callbacks.onStateChange
 * @param {(agent: string) => void} [callbacks.onActiveAgent] - chamado quando backend emite active_agent
 *
 * @returns {{ sendMessage: Function, disconnect: Function, resetSession: Function, getSessionId: Function }}
 */
export function createWSClient(callbacks = {}) {
  let socket       = null;
  let retryCount   = 0;
  let retryTimer   = null;
  let destroyed    = false;
  let sessionId    = null;  // session_id interno guardado pelo backend

  // Callbacks com valores por defeito (no-op)
  const {
    onSessionId    = () => {},
    onChunk        = () => {},
    onDone         = () => {},
    onError        = () => {},
    onSessionExpired = () => {},
    onStateChange  = () => {},
    onActiveAgent  = () => {},
  } = callbacks;

  // --- Ligação -----------------------------------------------------------

  function connect() {
    if (destroyed) return;

    onStateChange("connecting");

    socket = new WebSocket(WS_URL);

    socket.addEventListener("open", handleOpen);
    socket.addEventListener("message", handleMessage);
    socket.addEventListener("error", handleWSError);
    socket.addEventListener("close", handleClose);
  }

  function handleOpen() {
    retryCount = 0;
    onStateChange("connected");
  }

  function handleMessage(event) {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      console.warn("[ws] Mensagem não-JSON recebida:", event.data);
      return;
    }

    switch (msg.type) {
      case "session_id":
        sessionId = msg.session_id;
        onSessionId(msg.session_id);
        break;

      case "chunk":
        onChunk(msg.content ?? "", msg.agent ?? "");
        break;

      case "done":
        onDone();
        break;

      case "error":
        onError(msg.error ?? "Erro desconhecido");
        break;

      case "session_expired":
        // Limpa o session_id guardado — próxima mensagem inicia sessão nova
        sessionId = null;
        onSessionExpired(msg.agent ?? "");
        break;

      case "active_agent":
        // Backend notifica qual agente está activo (emitido pelo coordinator)
        onActiveAgent(msg.agent ?? "");
        break;

      default:
        console.warn("[ws] Tipo de mensagem desconhecido:", msg.type);
    }
  }

  function handleWSError(event) {
    // O evento de erro é sempre seguido de close; deixamos o handleClose tratar o retry.
    console.warn("[ws] Erro WebSocket:", event);
  }

  function handleClose(event) {
    socket = null;
    onStateChange("disconnected");

    if (destroyed) return;

    if (retryCount < MAX_RETRIES) {
      const delay = BASE_DELAY_MS * Math.pow(2, retryCount);
      retryCount++;
      console.info(`[ws] Ligação perdida. Retry ${retryCount}/${MAX_RETRIES} em ${delay}ms`);
      onStateChange("connecting");
      retryTimer = setTimeout(connect, delay);
    } else {
      console.error("[ws] Máximo de retries atingido. Ligação terminada.");
      onStateChange("disconnected");
    }
  }

  // --- API pública -------------------------------------------------------

  /**
   * Envia uma mensagem ao backend.
   *
   * @param {string} agent      - Nome do agente (ex: "architect")
   * @param {string} content    - Texto da mensagem
   * @param {string|null} [sid] - session_id explícito (opcional; usa o guardado se omitido)
   */
  function sendMessage(agent, content, sid = undefined) {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      onError("WebSocket não está ligado. A aguardar reconexão...");
      return false;
    }

    const payload = {
      type:       "message",
      content,
      agent,
      session_id: sid !== undefined ? sid : sessionId,
    };

    socket.send(JSON.stringify(payload));
    return true;
  }

  /**
   * Limpa o session_id guardado (força nova sessão na próxima mensagem).
   */
  function resetSession() {
    sessionId = null;
  }

  /**
   * Encerra a ligação e impede reconexão.
   */
  function disconnect() {
    destroyed = true;
    if (retryTimer !== null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (socket) {
      socket.close();
      socket = null;
    }
  }

  /**
   * Devolve o session_id actual (pode ser null se ainda não recebido).
   */
  function getSessionId() {
    return sessionId;
  }

  // Inicia a ligação imediatamente
  connect();

  return { sendMessage, resetSession, disconnect, getSessionId };
}
