/**
 * scene.js — Canvas 2D engine do Agent Office.
 * Canvas lógico: 480×320 (30×20 tiles de 16px)
 */

import { SPRITES } from './sprites.js';

// ─── Constantes ──────────────────────────────────────────────────────────────

const TILE   = 16;
const COLS   = 30;
const ROWS   = 20;
const CHAR_W = 16;
const CHAR_H = 24;

const WORK_FPS  = 8;
const IDLE_AMP  = 1.5;
const IDLE_FREQ = 0.05;

// ─── Layout de agentes ───────────────────────────────────────────────────────

const AGENT_POSITIONS = {
  coordinator:  { tx: 9,  ty: 14, room: 'main', sprite: 'CHAR_COORDINATOR'  },
  discovery:    { tx: 2,  ty: 6,  room: 'main', sprite: 'CHAR_DISCOVERY'    },
  architect:    { tx: 8,  ty: 6,  room: 'main', sprite: 'CHAR_ARCHITECT'    },
  challenger:   { tx: 14, ty: 6,  room: 'main', sprite: 'CHAR_CHALLENGER'   },
  synthesizer:  { tx: 5,  ty: 12, room: 'main', sprite: 'CHAR_SYNTHESIZER'  },
  devops:       { tx: 21, ty: 4,  room: 'tech', sprite: 'CHAR_DEVOPS'       },
  dba:          { tx: 27, ty: 4,  room: 'tech', sprite: 'CHAR_DBA'          },
  backend_dev:  { tx: 21, ty: 15, room: 'dev',  sprite: 'CHAR_BACKEND_DEV'  },
  frontend_dev: { tx: 25, ty: 15, room: 'dev',  sprite: 'CHAR_FRONTEND_DEV' },
  qa:           { tx: 27, ty: 17, room: 'dev',  sprite: 'CHAR_QA'           },
};

const AGENT_PHASE = Object.fromEntries(
  Object.keys(AGENT_POSITIONS).map((n, i) => [n, i * 0.73])
);

const AGENT_LABEL = {
  coordinator: 'coord',  discovery: 'discov', architect: 'arch',
  challenger:  'chall',  synthesizer: 'synth', backend_dev: 'backend',
  frontend_dev:'front',  dba: 'dba',           devops: 'devops', qa: 'qa',
};

// ─── Utilitários de desenho ──────────────────────────────────────────────────

function drawSprite(ctx, sprite, px, py) {
  const { palette, data } = sprite;
  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    for (let c = 0; c < row.length; c++) {
      const color = palette[row[c]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(px + c, py + r, 1, 1);
    }
  }
}

function fillTileArea(ctx, tileSprite, startCol, startRow, numCols, numRows) {
  for (let r = 0; r < numRows; r++)
    for (let c = 0; c < numCols; c++)
      drawSprite(ctx, tileSprite, (startCol + c) * TILE, (startRow + r) * TILE);
}

function fillRect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function _drawDesk(ctx, x, y, accent) {
  let bg, edge, hi;
  if (accent === 'cold') {
    [bg, edge, hi] = ['#3a5070', '#2a3858', '#608098'];
  } else if (accent === 'dev') {
    [bg, edge, hi] = ['#3a3060', '#282050', '#6060a0'];
  } else {
    [bg, edge, hi] = ['#7a4f2e', '#5a3a1e', '#c8a870'];
  }
  fillRect(ctx, bg,   x,                y,            TILE * 2, TILE);
  fillRect(ctx, edge, x,                y,            TILE * 2, 2);
  fillRect(ctx, edge, x,                y + TILE - 2, TILE * 2, 2);
  fillRect(ctx, edge, x,                y,            2,        TILE);
  fillRect(ctx, edge, x + TILE * 2 - 2, y,            2,        TILE);
  fillRect(ctx, hi,   x + 2,            y + 2,        TILE * 2 - 4, 3);
}

function _drawBoard(ctx, x, y) {
  fillRect(ctx, '#3a3050', x, y, TILE * 2, TILE);
  fillRect(ctx, '#2a2040', x, y,            TILE * 2, 2);
  fillRect(ctx, '#2a2040', x, y + TILE - 2, TILE * 2, 2);
  fillRect(ctx, '#2a2040', x, y,            2,        TILE);
  fillRect(ctx, '#2a2040', x + TILE * 2 - 2, y, 2,   TILE);
  fillRect(ctx, '#5060a0', x + 3, y + 4,  TILE - 4, 1);
  fillRect(ctx, '#5060a0', x + 3, y + 7,  TILE + 4, 1);
  fillRect(ctx, '#5060a0', x + 3, y + 10, TILE - 2, 1);
}

function _drawRoomLabel(ctx, x, y, text, color) {
  ctx.save();
  ctx.font = 'bold 7px monospace';
  ctx.textBaseline = 'top';
  const tw   = ctx.measureText(text).width;
  const padX = 4, padY = 3;
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(x - padX, y - padY, Math.ceil(tw) + padX * 2, 7 + padY * 2);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ─── Background ──────────────────────────────────────────────────────────────

function drawBackground(ctx) {
  // Pavimentos
  fillTileArea(ctx, SPRITES.FLOOR_WOOD,  0,  0,  18, ROWS); // Main Office — madeira quente
  fillTileArea(ctx, SPRITES.FLOOR_LIGHT, 19, 0,  11, 10);   // Tech Room — cinza frio
  fillTileArea(ctx, SPRITES.FLOOR_BLUE,  19, 11, 11,  9);   // Dev Room — azul/violeta

  // Parede vertical Main ↔ direita
  fillRect(ctx, '#3d2a18', 18 * TILE, 0,            TILE,      ROWS * TILE);
  fillRect(ctx, '#5a4028', 18 * TILE + 2, 5 * TILE, TILE - 4, 3 * TILE);

  // Parede horizontal Tech ↔ Dev
  fillRect(ctx, '#3d2a18', 19 * TILE, 10 * TILE, 11 * TILE, TILE);
  fillRect(ctx, '#5a4028', 22 * TILE, 10 * TILE,  2 * TILE, TILE);

  // Paredes exteriores
  fillRect(ctx, '#2a1c0c', 0,               0,               COLS * TILE, 2);
  fillRect(ctx, '#2a1c0c', 0,               ROWS * TILE - 2, COLS * TILE, 2);
  fillRect(ctx, '#2a1c0c', 0,               0,               2, ROWS * TILE);
  fillRect(ctx, '#2a1c0c', COLS * TILE - 2, 0,               2, ROWS * TILE);

  // ── Main Office ──────────────────────────────────────────────────────────── //
  drawSprite(ctx, SPRITES.BOOKSHELF,  1 * TILE, 2 * TILE);
  drawSprite(ctx, SPRITES.BOOKSHELF,  5 * TILE, 2 * TILE);
  drawSprite(ctx, SPRITES.BOOKSHELF, 10 * TILE, 2 * TILE);

  _drawDesk(ctx,  1 * TILE, 5 * TILE);
  _drawDesk(ctx,  7 * TILE, 5 * TILE);
  _drawDesk(ctx, 13 * TILE, 5 * TILE);
  drawSprite(ctx, SPRITES.COMPUTER,  1 * TILE + 1, 5 * TILE - 1);
  drawSprite(ctx, SPRITES.COMPUTER,  7 * TILE + 1, 5 * TILE - 1);
  drawSprite(ctx, SPRITES.COMPUTER, 13 * TILE + 1, 5 * TILE - 1);
  drawSprite(ctx, SPRITES.CHAIR,  1 * TILE, 6 * TILE);
  drawSprite(ctx, SPRITES.CHAIR,  7 * TILE, 6 * TILE);
  drawSprite(ctx, SPRITES.CHAIR, 13 * TILE, 6 * TILE);

  _drawDesk(ctx, 4 * TILE, 11 * TILE);
  drawSprite(ctx, SPRITES.COMPUTER, 4 * TILE + 1, 11 * TILE - 1);
  drawSprite(ctx, SPRITES.CHAIR,    4 * TILE,      12 * TILE);

  _drawDesk(ctx, 8 * TILE, 13 * TILE);
  drawSprite(ctx, SPRITES.COMPUTER, 8 * TILE + 1, 13 * TILE - 1);
  drawSprite(ctx, SPRITES.CHAIR,    8 * TILE,      14 * TILE);

  drawSprite(ctx, SPRITES.PLANT,  3,             (ROWS - 2) * TILE - 4);
  drawSprite(ctx, SPRITES.PLANT, 16 * TILE - 4,  (ROWS - 2) * TILE - 4);
  drawSprite(ctx, SPRITES.PLANT,  3,              9 * TILE);

  // ── Tech Room ────────────────────────────────────────────────────────────── //
  _drawDesk(ctx, 20 * TILE, 3 * TILE, 'cold');
  drawSprite(ctx, SPRITES.COMPUTER, 20 * TILE + 1, 3 * TILE - 1);
  drawSprite(ctx, SPRITES.CHAIR,    20 * TILE,      4 * TILE);

  _drawDesk(ctx, 26 * TILE, 3 * TILE, 'cold');
  drawSprite(ctx, SPRITES.COMPUTER, 26 * TILE + 1, 3 * TILE - 1);
  drawSprite(ctx, SPRITES.CHAIR,    26 * TILE,      4 * TILE);

  drawSprite(ctx, SPRITES.WATER_COOLER, 19 * TILE + 4, 1 * TILE);
  drawSprite(ctx, SPRITES.CLOCK,        25 * TILE,      1 * TILE);
  drawSprite(ctx, SPRITES.PLANT,        28 * TILE,      7 * TILE + 4);

  // ── Dev Room ─────────────────────────────────────────────────────────────── //
  _drawDesk(ctx, 20 * TILE, 14 * TILE, 'dev');
  drawSprite(ctx, SPRITES.COMPUTER, 20 * TILE + 1, 14 * TILE - 1);
  drawSprite(ctx, SPRITES.CHAIR,    20 * TILE,      15 * TILE);

  _drawDesk(ctx, 24 * TILE, 14 * TILE, 'dev');
  drawSprite(ctx, SPRITES.COMPUTER, 24 * TILE + 1, 14 * TILE - 1);
  drawSprite(ctx, SPRITES.CHAIR,    24 * TILE,      15 * TILE);

  _drawDesk(ctx, 26 * TILE, 16 * TILE, 'dev');
  drawSprite(ctx, SPRITES.COMPUTER, 26 * TILE + 1, 16 * TILE - 1);
  drawSprite(ctx, SPRITES.CHAIR,    26 * TILE,      17 * TILE);

  _drawBoard(ctx, 23 * TILE, 12 * TILE);
  drawSprite(ctx, SPRITES.BOOKSHELF, 19 * TILE,     13 * TILE);
  drawSprite(ctx, SPRITES.PLANT,     19 * TILE + 3, 18 * TILE);

  // ── Rótulos (canto superior esquerdo de cada sala) ──────────────────────── //
  _drawRoomLabel(ctx,  6,             5,             'Main Office', '#d4b060');
  _drawRoomLabel(ctx, 19 * TILE + 6,  5,             'Tech Room',   '#70d0d8');
  _drawRoomLabel(ctx, 19 * TILE + 6,  11 * TILE + 5, 'Dev Room',    '#9090e0');
}

// ─── Halo working ────────────────────────────────────────────────────────────

function _drawWorkingHalo(ctx, cx, cy, alpha) {
  for (let i = 5; i >= 1; i--) {
    ctx.save();
    ctx.globalAlpha = alpha * (i / 5) * 0.22;
    ctx.fillStyle = '#f0c040';
    ctx.fillRect(cx - CHAR_W / 2 - i * 2, cy - CHAR_H / 2 - i * 2,
                 CHAR_W + i * 4, CHAR_H + i * 4);
    ctx.restore();
  }
}

// ─── Name tag ────────────────────────────────────────────────────────────────

function _drawNameTag(ctx, agentName, centerX, topY, state, frameCount) {
  const label = AGENT_LABEL[agentName] || agentName;

  ctx.save();
  ctx.font = 'bold 6px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const tw   = ctx.measureText(label).width;
  const padX = 4, tagH = 8;
  const tagW = Math.ceil(tw + padX * 2);
  const tagX = Math.round(centerX - tagW / 2);
  const tagY = topY;
  const r    = tagH / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.beginPath();
  ctx.moveTo(tagX + r, tagY);
  ctx.lineTo(tagX + tagW - r, tagY);
  ctx.arc(tagX + tagW - r, tagY + r, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(tagX + r, tagY + tagH);
  ctx.arc(tagX + r, tagY + r, r, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = (state === 'working' || state === 'active') ? '#f0c040' : '#ffffff';
  ctx.fillText(label, centerX, tagY + tagH / 2);

  // "..." animado à direita (só em working)
  if (state === 'working') {
    const dotPhase = Math.floor(frameCount / 10) % 3;
    const rx = tagX + tagW + 2;
    const dy = Math.round(tagY + tagH / 2 - 1);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i <= dotPhase ? '#f0c040' : 'rgba(240,192,64,0.2)';
      ctx.fillRect(rx + i * 3, dy, 2, 2);
    }
  }

  ctx.restore();
}

// ─── Personagem ──────────────────────────────────────────────────────────────

function _drawCharacter(ctx, agentName, pos, state, frameCount) {
  const { tx, ty, sprite: spriteName } = pos;
  const phase = AGENT_PHASE[agentName] || 0;

  // Bob vertical
  let yOff;
  if (state === 'working') {
    yOff = (Math.floor(frameCount / 4) % 2 === 0) ? 0 : -1;
  } else {
    yOff = Math.round(Math.sin(frameCount * IDLE_FREQ + phase) * IDLE_AMP);
  }

  const px = tx * TILE;
  const py = ty * TILE - 8 + yOff;
  const cx = px + CHAR_W / 2;
  const cy = py + CHAR_H / 2;

  if (state === 'working') {
    const haloAlpha = 0.55 + 0.3 * Math.sin(frameCount * 0.12 + phase);
    _drawWorkingHalo(ctx, cx, cy, haloAlpha);
  }

  if (state === 'active') {
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#f0c040';
    ctx.fillRect(px - 2, py, CHAR_W + 4, CHAR_H);
    ctx.restore();
  }

  const frame = state === 'working'
    ? Math.floor(frameCount / WORK_FPS) % 2
    : Math.floor(frameCount / 45) % 2;

  const sprite = SPRITES[`${spriteName}_${frame}`];
  if (sprite) {
    drawSprite(ctx, sprite, px, py);
  } else {
    fillRect(ctx, '#ff00ff', px + 2, py + 4, 12, 18);
  }

  _drawNameTag(ctx, agentName, px + CHAR_W / 2, py + CHAR_H + 2, state, frameCount);
}

// ─── Hit detection ───────────────────────────────────────────────────────────

export function getAgentAt(lx, ly) {
  for (const [name, pos] of Object.entries(AGENT_POSITIONS)) {
    const px = pos.tx * TILE;
    const py = pos.ty * TILE - 8;
    if (lx >= px && lx < px + CHAR_W && ly >= py && ly < py + CHAR_H) return name;
  }
  return null;
}

// ─── Loop principal ──────────────────────────────────────────────────────────

export function initScene(canvas, onAgentClick) {
  canvas.width  = COLS * TILE; // 480
  canvas.height = ROWS * TILE; // 320

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const bgCanvas = document.createElement('canvas');
  bgCanvas.width  = canvas.width;
  bgCanvas.height = canvas.height;
  const bgCtx = bgCanvas.getContext('2d');
  bgCtx.imageSmoothingEnabled = false;
  drawBackground(bgCtx);

  const loadingEl = document.getElementById('canvas-loading');
  if (loadingEl) loadingEl.classList.add('hidden');

  let frameCount     = 0;
  let activeAgent    = null;
  let thinkingAgents = new Set();
  let hoverAgent     = null;
  let animId         = null;

  function render() {
    frameCount++;
    ctx.drawImage(bgCanvas, 0, 0);

    for (const [name, pos] of Object.entries(AGENT_POSITIONS)) {
      let state = null;
      if (thinkingAgents.has(name))  state = 'working';
      else if (name === activeAgent) state = 'active';
      else if (name === hoverAgent)  state = 'hover';
      _drawCharacter(ctx, name, pos, state, frameCount);
    }

    animId = requestAnimationFrame(render);
  }

  animId = requestAnimationFrame(render);

  function cssToLogical(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      lx: Math.floor((e.clientX - rect.left) * canvas.width  / rect.width),
      ly: Math.floor((e.clientY - rect.top)  * canvas.height / rect.height),
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
