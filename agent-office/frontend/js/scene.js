/**
 * scene.js — Engine Canvas 2D do escritório pixel art.
 *
 * Arquitectura de escala:
 *  - Canvas interno (lógico): COLS×TILE × ROWS×TILE pixels = 384×256
 *  - CSS escala visualmente via width:auto, height:100%, image-rendering:pixelated
 *  - Todos os desenhos usam coordenadas lógicas (sem SCALE)
 *  - Coordenadas de rato são convertidas de CSS para lógicas no hit detection
 *
 * Grid de tiles: 24 cols × 16 rows de 16px = 384×256 pixels lógicos
 */

import { SPRITES } from './sprites.js';

// =============================================================================
// CONSTANTES
// =============================================================================

const TILE  = 16;   // tamanho de tile em pixels lógicos
const COLS  = 24;   // colunas de tiles
const ROWS  = 16;   // linhas de tiles
const CHAR_W = 16;  // largura personagem
const CHAR_H = 24;  // altura personagem

// Frame rate da animação idle
const IDLE_FRAME_INTERVAL = 45;  // troca de frame a cada ~45 RAF frames

// =============================================================================
// POSIÇÕES DOS AGENTES (em tiles)
// =============================================================================

const AGENT_POSITIONS = {
  discovery:    { tx: 2,  ty: 3,  room: 'main',       sprite: 'CHAR_DISCOVERY' },
  architect:    { tx: 7,  ty: 3,  room: 'main',       sprite: 'CHAR_ARCHITECT' },
  challenger:   { tx: 4,  ty: 5,  room: 'main',       sprite: 'CHAR_CHALLENGER' },
  synthesizer:  { tx: 2,  ty: 7,  room: 'main',       sprite: 'CHAR_SYNTHESIZER' },
  backend_dev:  { tx: 7,  ty: 7,  room: 'main',       sprite: 'CHAR_BACKEND_DEV' },
  frontend_dev: { tx: 14, ty: 2,  room: 'breakroom',  sprite: 'CHAR_FRONTEND_DEV' },
  devops:       { tx: 14, ty: 5,  room: 'breakroom',  sprite: 'CHAR_DEVOPS' },
  dba:          { tx: 13, ty: 9,  room: 'conference', sprite: 'CHAR_DBA' },
  qa:           { tx: 16, ty: 9,  room: 'conference', sprite: 'CHAR_QA' },
};

const ROOM_GLOW = {
  main:       '#c89840',
  breakroom:  '#60c0d0',
  conference: '#6080d0',
};

// =============================================================================
// UTILITÁRIOS DE DESENHO (coordenadas lógicas)
// =============================================================================

/**
 * Desenha um sprite pixel-a-pixel.
 * Cada char da string de data mapeia para uma cor na paleta do sprite.
 * Char '_' (ou null na paleta) = transparente (skip).
 */
function drawSprite(ctx, sprite, px, py) {
  const { palette, data } = sprite;
  const rows = data.length;
  for (let r = 0; r < rows; r++) {
    const row = data[r];
    const cols = row.length;
    for (let c = 0; c < cols; c++) {
      const color = palette[row[c]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(px + c, py + r, 1, 1);
    }
  }
}

/**
 * Preenche uma área rectangular de tiles com o mesmo tile sprite.
 */
function fillTileArea(ctx, tileSprite, startCol, startRow, numCols, numRows) {
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      drawSprite(ctx, tileSprite, (startCol + c) * TILE, (startRow + r) * TILE);
    }
  }
}

/**
 * Rectângulo sólido em coordenadas lógicas.
 */
function fillRect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/**
 * Glow ellíptico debaixo da personagem.
 */
function drawGlow(ctx, cx, cy, color, alpha) {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = `rgb(${r},${g},${b})`;

  // Ellipse simples (sem gradiente para evitar problemas de escala)
  ctx.beginPath();
  ctx.ellipse(cx, cy, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// =============================================================================
// LAYOUT DO ESCRITÓRIO
// =============================================================================

function drawBackground(ctx) {
  // --- Salas de piso ------------------------------------------------------ //

  // Sala principal (madeira): cols 0-10, todas as rows
  fillTileArea(ctx, SPRITES.FLOOR_WOOD, 0, 0, 11, ROWS);

  // Sala de pausa (claro): cols 12-23, rows 0-6
  fillTileArea(ctx, SPRITES.FLOOR_LIGHT, 12, 0, 12, 7);

  // Sala de reunião (azul): cols 12-23, rows 8-15
  fillTileArea(ctx, SPRITES.FLOOR_BLUE, 12, 8, 12, 8);

  // --- Divisórias --------------------------------------------------------- //

  // Parede vertical entre sala principal e salas direitas
  fillRect(ctx, '#3d2a18', 11 * TILE, 0, TILE, ROWS * TILE);
  // Passagem/janela na parede
  fillRect(ctx, '#5a4028', 11 * TILE + 2, 4 * TILE, TILE - 4, 3 * TILE);

  // Parede horizontal entre sala de pausa e sala de reunião
  fillRect(ctx, '#3d2a18', 12 * TILE, 7 * TILE, 12 * TILE, TILE);
  // Porta na divisória horizontal
  fillRect(ctx, '#5a4028', 14 * TILE, 7 * TILE, 2 * TILE, TILE);

  // --- Paredes exteriores ------------------------------------------------- //

  // Topo
  fillRect(ctx, '#3a2810', 0, 0, COLS * TILE, 3);
  // Esquerda
  fillRect(ctx, '#3a2810', 0, 0, 3, ROWS * TILE);
  // Direita
  fillRect(ctx, '#3a2810', COLS * TILE - 3, 0, 3, ROWS * TILE);
  // Fundo
  fillRect(ctx, '#3a2810', 0, ROWS * TILE - 3, COLS * TILE, 3);

  // --- Objectos e mobília ------------------------------------------------- //

  // Estantes de livros na parede de cima da sala principal
  drawSprite(ctx, SPRITES.BOOKSHELF, 1 * TILE, 4);
  drawSprite(ctx, SPRITES.BOOKSHELF, 3 * TILE, 4);
  drawSprite(ctx, SPRITES.BOOKSHELF, 5 * TILE, 4);
  drawSprite(ctx, SPRITES.BOOKSHELF, 7 * TILE, 4);

  // Mesas na sala principal
  _drawSimpleDesk(ctx, 1 * TILE, 2 * TILE);   // discovery
  _drawSimpleDesk(ctx, 6 * TILE, 2 * TILE);   // architect
  _drawSimpleDesk(ctx, 3 * TILE, 4 * TILE);   // challenger
  _drawSimpleDesk(ctx, 1 * TILE, 6 * TILE);   // synthesizer
  _drawSimpleDesk(ctx, 6 * TILE, 6 * TILE);   // backend_dev

  // Computadores nas mesas
  drawSprite(ctx, SPRITES.COMPUTER, 1 * TILE + 1, 2 * TILE - 1);
  drawSprite(ctx, SPRITES.COMPUTER, 6 * TILE + 1, 2 * TILE - 1);
  drawSprite(ctx, SPRITES.COMPUTER, 4 * TILE + 1, 4 * TILE - 1);
  drawSprite(ctx, SPRITES.COMPUTER, 1 * TILE + 1, 6 * TILE - 1);
  drawSprite(ctx, SPRITES.COMPUTER, 6 * TILE + 1, 6 * TILE - 1);

  // Plantas nos cantos da sala principal
  drawSprite(ctx, SPRITES.PLANT, 3, 13 * TILE - 4);
  drawSprite(ctx, SPRITES.PLANT, 9 * TILE - 4, 13 * TILE - 4);

  // Sala de pausa
  drawSprite(ctx, SPRITES.WATER_COOLER, 20 * TILE + 2, 1 * TILE);
  drawSprite(ctx, SPRITES.CLOCK, 22 * TILE, 1 * TILE);
  drawSprite(ctx, SPRITES.PLANT, 12 * TILE + 2, 1 * TILE);

  // Sala de reunião
  _drawSimpleDesk(ctx, 13 * TILE, 8 * TILE + 2);
  _drawSimpleDesk(ctx, 17 * TILE, 8 * TILE + 2);
  drawSprite(ctx, SPRITES.BOOKSHELF, 12 * TILE, 9 * TILE);
  drawSprite(ctx, SPRITES.PLANT, 22 * TILE, 14 * TILE);
  drawSprite(ctx, SPRITES.PLANT, 12 * TILE + 2, 14 * TILE);

  // Quadro na parede da sala de reunião
  _drawBoard(ctx, 18 * TILE, 8 * TILE + 2);

  // --- Rótulos das salas -------------------------------------------------- //
  _drawRoomLabel(ctx, 3, ROWS * TILE - 12, 'Main Office', '#c8a870');
  _drawRoomLabel(ctx, 12 * TILE + 4, 4, 'Break Room', '#a0d0d0');
  _drawRoomLabel(ctx, 12 * TILE + 4, 8 * TILE + 4, 'Conference', '#8090d0');
}

/**
 * Mesa simplificada 2×1 tiles.
 */
function _drawSimpleDesk(ctx, x, y) {
  fillRect(ctx, '#7a4f2e', x, y, TILE * 2, TILE);
  fillRect(ctx, '#5a3a1e', x, y, TILE * 2, 2);
  fillRect(ctx, '#5a3a1e', x, y + TILE - 2, TILE * 2, 2);
  fillRect(ctx, '#5a3a1e', x, y, 2, TILE);
  fillRect(ctx, '#5a3a1e', x + TILE * 2 - 2, y, 2, TILE);
  fillRect(ctx, '#c8a870', x + 2, y + 2, TILE * 2 - 4, 3);
}

/**
 * Quadro branco na parede da sala de reunião.
 */
function _drawBoard(ctx, x, y) {
  fillRect(ctx, '#3a3050', x, y, TILE * 2, TILE);
  fillRect(ctx, '#2a2040', x, y, TILE * 2, 2);
  fillRect(ctx, '#2a2040', x, y + TILE - 2, TILE * 2, 2);
  fillRect(ctx, '#2a2040', x, y, 2, TILE);
  fillRect(ctx, '#2a2040', x + TILE * 2 - 2, y, 2, TILE);
  // Linhas no quadro
  fillRect(ctx, '#5060a0', x + 3, y + 4, TILE - 4, 1);
  fillRect(ctx, '#5060a0', x + 3, y + 7, TILE + 4, 1);
  fillRect(ctx, '#5060a0', x + 3, y + 10, TILE - 2, 1);
}

/**
 * Rótulo de sala em pixel art (texto minimalista).
 */
function _drawRoomLabel(ctx, x, y, text, color) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - 1, y - 1, text.length * 4 + 4, 8);
  ctx.fillStyle = color;
  ctx.font = '6px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// =============================================================================
// PERSONAGENS
// =============================================================================

/**
 * Desenha uma personagem na posição de tile (tx, ty).
 * A personagem é posicionada ligeiramente acima do tile.
 */
function drawCharacter(ctx, spriteName, tx, ty, frame, state, room, frameCount) {
  // Coordenadas lógicas em pixels
  const px = tx * TILE;
  const py = ty * TILE - 8;

  // Centro da personagem para o glow
  const cx = px + CHAR_W / 2;
  const cy = py + CHAR_H;

  // Glow debaixo da personagem
  if (state === 'active' || state === 'thinking') {
    const glowColor = ROOM_GLOW[room] || '#c89840';
    const glowAlpha = state === 'thinking'
      ? 0.5 + 0.3 * Math.sin(frameCount * 0.08)
      : 0.35 + 0.15 * Math.sin(frameCount * 0.05);
    drawGlow(ctx, cx, cy, glowColor, glowAlpha);
  }

  // Sprite da personagem
  const spriteKey = `${spriteName}_${frame}`;
  const sprite = SPRITES[spriteKey];
  if (sprite) {
    drawSprite(ctx, sprite, px, py);
  } else {
    // Fallback: rectângulo colorido se sprite não existe
    fillRect(ctx, '#ff00ff', px + 2, py + 4, 12, 18);
  }

  // Pontos de "thinking"
  if (state === 'thinking') {
    _drawThinkingDots(ctx, cx, py - 4, frameCount);
  }
}

/**
 * 3 pontos animados acima da cabeça.
 */
function _drawThinkingDots(ctx, cx, cy, frameCount) {
  const spacing = 4;
  const startX = Math.floor(cx - spacing);

  for (let i = 0; i < 3; i++) {
    const phase = frameCount * 0.07 - i * 0.8;
    const alpha = Math.max(0.1, Math.min(1, 0.5 + 0.5 * Math.sin(phase)));
    const oy = -Math.abs(Math.sin(phase)) * 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(
      startX + i * spacing,
      Math.round(cy + oy),
      2, 2
    );
    ctx.restore();
  }
}

// =============================================================================
// HIT DETECTION
// =============================================================================

/**
 * Dado um clique em coordenadas LÓGICAS (x, y),
 * devolve o nome do agente ou null.
 *
 * @param {number} lx - x em pixels lógicos do canvas
 * @param {number} ly - y em pixels lógicos do canvas
 * @returns {string|null}
 */
export function getAgentAt(lx, ly) {
  for (const [name, pos] of Object.entries(AGENT_POSITIONS)) {
    const px = pos.tx * TILE;
    const py = pos.ty * TILE - 8;
    if (lx >= px && lx < px + CHAR_W && ly >= py && ly < py + CHAR_H) {
      return name;
    }
  }
  return null;
}

// =============================================================================
// LOOP PRINCIPAL
// =============================================================================

/**
 * Inicializa a cena e arranca o loop de animação.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {(name: string) => void} onAgentClick
 */
export function initScene(canvas, onAgentClick) {
  // Dimensões internas do canvas (resolução lógica)
  canvas.width  = COLS * TILE;   // 384
  canvas.height = ROWS * TILE;   // 256

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // --- Fundo pré-renderizado ------------------------------------------------

  const bgCanvas = document.createElement('canvas');
  bgCanvas.width  = canvas.width;
  bgCanvas.height = canvas.height;
  const bgCtx = bgCanvas.getContext('2d');
  bgCtx.imageSmoothingEnabled = false;
  drawBackground(bgCtx);

  // Esconde o overlay de loading após o fundo estar pronto
  const loadingEl = document.getElementById('canvas-loading');
  if (loadingEl) loadingEl.classList.add('hidden');

  // --- Estado --------------------------------------------------------------- //

  let frameCount    = 0;
  let activeAgent   = null;
  let thinkingAgents = new Set();
  let hoverAgent    = null;
  let animId        = null;

  // --- Loop de animação ----------------------------------------------------- //

  function render() {
    frameCount++;
    ctx.drawImage(bgCanvas, 0, 0);

    const idleFrame = Math.floor(frameCount / IDLE_FRAME_INTERVAL) % 2;

    for (const [name, pos] of Object.entries(AGENT_POSITIONS)) {
      let state = null;
      if (thinkingAgents.has(name)) state = 'thinking';
      else if (name === activeAgent) state = 'active';
      else if (name === hoverAgent)  state = 'hover';

      drawCharacter(ctx, pos.sprite, pos.tx, pos.ty, idleFrame, state, pos.room, frameCount);
    }

    animId = requestAnimationFrame(render);
  }

  animId = requestAnimationFrame(render);

  // --- Eventos de rato ------------------------------------------------------ //

  /**
   * Converte coordenadas CSS do evento para coordenadas lógicas do canvas.
   */
  function cssToLogical(e) {
    const rect = canvas.getBoundingClientRect();
    // O canvas é escalado pelo CSS — converter proporcionalmente
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      lx: Math.floor((e.clientX - rect.left) * scaleX),
      ly: Math.floor((e.clientY - rect.top)  * scaleY),
    };
  }

  canvas.addEventListener('mousemove', (e) => {
    const { lx, ly } = cssToLogical(e);
    const found = getAgentAt(lx, ly);
    if (found !== hoverAgent) {
      hoverAgent = found;
      canvas.style.cursor = found ? 'pointer' : 'default';
    }
  });

  canvas.addEventListener('mouseleave', () => {
    hoverAgent = null;
    canvas.style.cursor = 'default';
  });

  canvas.addEventListener('click', (e) => {
    const { lx, ly } = cssToLogical(e);
    const found = getAgentAt(lx, ly);
    if (found) onAgentClick(found);
  });

  // --- API pública ---------------------------------------------------------- //

  function setActiveAgent(name) {
    activeAgent = name;
    thinkingAgents.delete(name);
  }

  function setAgentThinking(name, bool) {
    if (bool) thinkingAgents.add(name);
    else       thinkingAgents.delete(name);
  }

  function destroy() {
    if (animId !== null) cancelAnimationFrame(animId);
    animId = null;
  }

  return { setActiveAgent, setAgentThinking, getAgentAt, destroy };
}
