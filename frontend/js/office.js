/**
 * office.js — Wrapper sobre scene.js.
 *
 * Expõe a API esperada pelo app.js:
 *  - createOffice(canvasEl, onAgentSelect)
 *  - setActiveAgent(name)
 *  - setAgentThinking(name, bool)
 *  - getAgentMeta(name) → { icon, label, color }
 *
 * Mantém compatibilidade com o app.js existente.
 * A renderização é delegada inteiramente para scene.js.
 */

import { initScene } from './scene.js';

// --- Metadados por agente -------------------------------------------------- //
// Usados pelo app.js para preencher o header e os badges do chat.

const AGENT_META = {
  discovery:    { icon: 'D', label: 'Discovery',    color: '#58a6ff' },
  architect:    { icon: 'A', label: 'Architect',    color: '#d2a8ff' },
  challenger:   { icon: 'C', label: 'Challenger',   color: '#ff7b72' },
  synthesizer:  { icon: 'S', label: 'Synthesizer',  color: '#79c0ff' },
  backend_dev:  { icon: 'B', label: 'Backend Dev',  color: '#56d364' },
  frontend_dev: { icon: 'F', label: 'Frontend Dev', color: '#f78166' },
  dba:          { icon: 'X', label: 'DBA',          color: '#ffa657' },
  devops:       { icon: 'O', label: 'DevOps',       color: '#8b949e' },
  qa:           { icon: 'Q', label: 'QA',           color: '#bc8cff' },
  coordinator:  { icon: 'Z', label: 'Coordinator',  color: '#58a6ff' },
};

function getMeta(name) {
  return AGENT_META[name] ?? {
    icon:  '?',
    label: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
    color: '#8b949e',
  };
}

// --- Factory --------------------------------------------------------------- //

/**
 * Inicializa o office canvas e devolve a API pública.
 *
 * @param {HTMLCanvasElement} canvasEl
 * @param {(agentName: string) => void} onAgentSelect
 * @returns {{
 *   renderAgents: (agents: string[]) => void,
 *   setActiveAgent: (name: string) => void,
 *   setAgentThinking: (name: string, bool: boolean) => void,
 *   getAgentMeta: (name: string) => { icon: string, label: string, color: string },
 * }}
 */
export function createOffice(canvasEl, onAgentSelect) {
  // Inicializa a cena canvas — o loop de animação arranca aqui
  const scene = initScene(canvasEl, onAgentSelect);

  /**
   * Compatibilidade com o app.js original que chamava renderAgents(list).
   * No modo canvas a lista de agentes está hardcoded no scene.js,
   * por isso este método é um no-op mas mantido para não quebrar o app.js.
   *
   * @param {string[]|object[]} _agents
   */
  function renderAgents(_agents) {
    // No-op: as personagens são fixas no layout canvas
  }

  function setActiveAgent(name) {
    scene.setActiveAgent(name);
  }

  function setAgentThinking(name, bool) {
    scene.setAgentThinking(name, bool);
  }

  function getAgentMeta(name) {
    return getMeta(name);
  }

  return { renderAgents, setActiveAgent, setAgentThinking, getAgentMeta };
}
