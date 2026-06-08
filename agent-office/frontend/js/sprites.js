/**
 * sprites.js — Sprites pixel art para o Agent Office.
 *
 * Regras de formato:
 *  - Cada sprite tem { palette, data }
 *  - palette: objecto letra → cor hex | null (null = transparente)
 *  - data: array de strings; cada string tem exatamente o mesmo comprimento
 *  - Tiles de piso: 16×16, tiles de parede: 16×8
 *  - Objectos: 16×16 ou 32×16
 *  - Personagens: 16×24, com 2 frames idle (_0 e _1)
 *
 * Exporta: SPRITES, PALETTE
 */

export const PALETTE = {
  WA: '#c8955f', WB: '#b8824f', WC: '#d4a870',
  BA: '#3d5f8f', BB: '#4a6fa5', BC: '#2d4f7f',
  LA: '#e8e4d4', LB: '#d8d4c4', LC: '#f0eee0',
  PA: '#8b7355', PB: '#6b5335',
  _: null,
};

// =============================================================================
// TILES DE PISO — 16×16
// =============================================================================

const FLOOR_WOOD = {
  palette: { _: null, A: '#c8955f', B: '#b8824f', C: '#d4a870', D: '#a06838' },
  data: [
    "AABCAABCAABCAABC",
    "BCAABCAABCAABCAA",
    "CAABCAABCAABCAAB",
    "ABCAABCAABCAABCA",
    "AABCAABCAABCAABC",
    "BCAABCAABCAABCAA",
    "CAABCAABCAABCAAB",
    "ABCAABCAABCAABCA",
    "DDDAABCAABCAADDD",
    "ABCAABCAABCAABCA",
    "AABCAABCAABCAABC",
    "BCAABCAABCAABCAA",
    "CAABCAABCAABCAAB",
    "ABCAABCAABCAABCA",
    "AABCAABCAABCAABC",
    "BCAABCAABCAABCAA",
  ],
};

const FLOOR_BLUE = {
  palette: { _: null, A: '#3d5f8f', B: '#4a6fa5', C: '#2d4f7f' },
  data: [
    "AABCAABCAABCAABC",
    "BCAABCAABCAABCAA",
    "CAABCAABCAABCAAB",
    "ABCAABCAABCAABCA",
    "AABCAABCAABCAABC",
    "BCAABCAABCAABCAA",
    "CAABCAABCAABCAAB",
    "ABCAABCAABCAABCA",
    "AABCAABCAABCAABC",
    "BCAABCAABCAABCAA",
    "CAABCAABCAABCAAB",
    "ABCAABCAABCAABCA",
    "AABCAABCAABCAABC",
    "BCAABCAABCAABCAA",
    "CAABCAABCAABCAAB",
    "ABCAABCAABCAABCA",
  ],
};

const FLOOR_LIGHT = {
  palette: { _: null, A: '#e8e4d4', B: '#d8d4c4', C: '#f0eee0' },
  data: [
    "AABCAABCAABCAABC",
    "BCAABCAABCAABCAA",
    "CAABCAABCAABCAAB",
    "ABCAABCAABCAABCA",
    "AABCAABCAABCAABC",
    "BCAABCAABCAABCAA",
    "CAABCAABCAABCAAB",
    "ABCAABCAABCAABCA",
    "AABCAABCAABCAABC",
    "BCAABCAABCAABCAA",
    "CAABCAABCAABCAAB",
    "ABCAABCAABCAABCA",
    "AABCAABCAABCAABC",
    "BCAABCAABCAABCAA",
    "CAABCAABCAABCAAB",
    "ABCAABCAABCAABCA",
  ],
};

// =============================================================================
// PAREDE — 16×8
// =============================================================================

const WALL_TOP = {
  palette: { _: null, A: '#8b7355', B: '#6b5335', C: '#a08060', D: '#4a3020' },
  data: [
    "DDDDDDDDDDDDDDDD",
    "BBBBBBBBBBBBBBBB",
    "AABBAABBAAABABBA",
    "CCAACCAACCCAACCA",
    "AACCAACCAAACCAAC",
    "CCAACCAACCCAACCA",
    "AABBAABBAAABABBA",
    "CCAACCAACCCAACCA",
  ],
};

// =============================================================================
// COMPUTADOR — 16×16
// =============================================================================

const COMPUTER = {
  palette: { _: null, A: '#2a2a3e', B: '#1a1a2e', C: '#4fd3ff', D: '#3ab8e8', E: '#80e8ff', F: '#404058' },
  data: [
    "________________",
    "_BBBBBBBBBBBBBB_",
    "_BAAAAAAAAAAAB__",
    "_BACCCCCCCCAB___",
    "_BACDDDDDDDCAB__",
    "_BACDDEEEDDCAB__",
    "_BACDDEEEDDCAB__",
    "_BACDDEEEDDCAB__",
    "_BACDDDDDDDCAB__",
    "_BACCCCCCCCAB___",
    "_BAAAAAAAAAAAB__",
    "_BBBBBBBBBBBBBB_",
    "______BBBBB_____",
    "____BFFFFFFF____",
    "____BFFFFFFF____",
    "________________",
  ],
};

// =============================================================================
// CADEIRA — 16×16
// =============================================================================

const CHAIR = {
  palette: { _: null, A: '#4a3828', B: '#6a5848', C: '#3a2818', D: '#8a7868' },
  data: [
    "________________",
    "___BBBBBBBB_____",
    "___BAAAAAAB_____",
    "___BADDDDAB_____",
    "___BADDDDAB_____",
    "___BAAAAAAB_____",
    "___CBBBBBBC_____",
    "___CAAAAC_______",
    "___CAAAAC_______",
    "__CCCAAACCC_____",
    "________________",
    "________________",
    "________________",
    "________________",
    "________________",
    "________________",
  ],
};

// =============================================================================
// ESTANTE DE LIVROS — 32×16
// =============================================================================

// Estante de livros — 32 colunas × 16 linhas
// Todas as linhas têm exactamente 32 caracteres.
const BOOKSHELF = (() => {
  const W = 32;
  const palette = { _: null, A: '#5a3820', B: '#7a5830', C: '#e84040', D: '#4080e8', E: '#40c840', F: '#e8c840', G: '#c840e8', H: '#e89840', J: '#3a2810' };
  // Função auxiliar para garantir comprimento exacto
  const row = (s) => (s + 'J'.repeat(W)).slice(0, W);
  const data = [
    'J'.repeat(W),
    row('JCCDDEEEFFFFGGHHCCDDBBAAHHGGFCCJ'),
    row('JCCDDEEEFFFFGGHHCCDDBBAAHHGGFCCJ'),
    row('JCCDDEEEFFFFGGHHCCDDBBAAHHGGFCCJ'),
    row('JCCDDEEEFFFFGGHHCCDDBBAAHHGGFCCJ'),
    row('JCCDDEEEFFFFGGHHCCDDBBAAHHGGFCCJ'),
    row('J' + 'B'.repeat(W - 2) + 'J'),
    row('JCCHHEEEFFFGDDCCHHBBEEAAFGGHHDDJ'),
    row('JCCHHEEEFFFGDDCCHHBBEEAAFGGHHDDJ'),
    row('JCCHHEEEFFFGDDCCHHBBEEAAFGGHHDDJ'),
    row('JCCHHEEEFFFGDDCCHHBBEEAAFGGHHDDJ'),
    row('JCCHHEEEFFFGDDCCHHBBEEAAFGGHHDDJ'),
    row('J' + 'B'.repeat(W - 2) + 'J'),
    row('J' + 'A'.repeat(W - 2) + 'J'),
    'J'.repeat(W),
    'J'.repeat(W),
  ];
  return { palette, data };
})();

// =============================================================================
// PLANTA — 16×16
// =============================================================================

const PLANT = {
  palette: { _: null, A: '#2d8a3e', B: '#1a6b2e', C: '#3daa4e', D: '#8b4513', E: '#6b3010' },
  data: [
    "________________",
    "____CCCCC_______",
    "___CBBBBBC______",
    "__CBABABABC_____",
    "__CBAAAABC______",
    "___CBBBBC_______",
    "____CAAC________",
    "_____DD_________",
    "____DEEED_______",
    "___DEEEEEED_____",
    "___DEEEEEED_____",
    "___DEEEEEED_____",
    "____DDDDD_______",
    "________________",
    "________________",
    "________________",
  ],
};

// =============================================================================
// RELÓGIO — 16×16
// =============================================================================

const CLOCK = {
  palette: { _: null, A: '#f0f0f0', B: '#d0d0d0', C: '#303030', D: '#c08040', E: '#a06030' },
  data: [
    "____DDDDDDD_____",
    "___DEAAAAED_____",
    "__DEABBBBAED____",
    "__DABAAAAABD____",
    "__DABACAABD_____",
    "__DABACCABD_____",
    "__DABAAACABD____",
    "__DABAAABD______",
    "__DABBBBBBD_____",
    "__DEAAAAED______",
    "___DDDDDDD______",
    "________________",
    "________________",
    "________________",
    "________________",
    "________________",
  ],
};

// =============================================================================
// BEBEDOURO — 16×16
// =============================================================================

const WATER_COOLER = {
  palette: { _: null, A: '#c0d8f0', B: '#80b0e0', C: '#4080c0', D: '#304060', E: '#ffffff', F: '#60608a' },
  data: [
    "________________",
    "____EEEEEEE_____",
    "___EAAAAAFE_____",
    "___EAAAAAFE_____",
    "___EAAAAAFE_____",
    "____EEEEEEE_____",
    "______BBB_______",
    "______BCB_______",
    "_____DBBBD______",
    "____DBBBBBD_____",
    "____DBBBBBD_____",
    "____DBBBBBD_____",
    "____DBBBBBD_____",
    "____DDDDDDD_____",
    "________________",
    "________________",
  ],
};

// =============================================================================
// PERSONAGENS — 16×24, 2 frames idle
//
// Estrutura vertical:
//   linhas 0-7:   cabeça (8 linhas)
//   linhas 8-15:  tronco/braços (8 linhas)
//   linhas 16-23: pernas (8 linhas)
//
// Todas as linhas têm exatamente 16 caracteres.
// =============================================================================

// Todas as linhas de dados de personagem têm de ter 16 chars exactamente.
// Cada personagem tem 24 linhas (8 cabeça + 8 tronco + 8 pernas).

// --- Discovery — cabelo escuro, camisola azul ---
const [CHAR_DISCOVERY_0, CHAR_DISCOVERY_1] = (() => {
  const P = { _: null, H: '#1a1a2a', K: '#f4c5a1', B: '#c0a080', W: '#ffffff', E: '#2060c0', F: '#1a4a9a', L: '#3a2a1a', S: '#5a4a3a' };
  const head = [
    "____HHHHHH______",
    "___HHHHHHHH_____",
    "__HHKKKKKKH_____",
    "__HKWBWKKKH_____",
    "__HKBKKKBKH_____",
    "__HKKKKKKKH_____",
    "___HKKKKKH______",
    "____HHHHHH______",
  ];
  const body = [
    "____EEEEEE______",
    "___EKEEEEKE_____",
    "__EKKKKKKKKE____",
    "__EEEEEEEEEE____",
    "__EFFEEFFEE_____",
    "___EEEEEEEE_____",
    "___KEEEEEK______",
    "____FFFFFF______",
  ];
  const legs0 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "____SS__SS______",
  ];
  const legs1 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "_____SS_SS______",
  ];
  return [{ palette: P, data: [...head, ...body, ...legs0] }, { palette: P, data: [...head, ...body, ...legs1] }];
})();

// --- Architect — cabelo loiro, casaco roxo ---
const [CHAR_ARCHITECT_0, CHAR_ARCHITECT_1] = (() => {
  const P = { _: null, H: '#c8a820', K: '#f4c5a1', B: '#c0a080', W: '#ffffff', E: '#6030a0', F: '#4a2080', L: '#302040', S: '#504060' };
  const head = [
    "____HHHHHH______",
    "___HHHHHHHHH____",
    "__HHHKKKKKH_____",
    "__HHKWBWKKH_____",
    "__HHKBKKKBH_____",
    "__HHKKKKKH______",
    "___HHKKKH_______",
    "____HHHH________",
  ];
  const body = [
    "____EEEEEE______",
    "___EEEEEEE______",
    "__EKKKKKKKKE____",
    "__EEEEEEEEEE____",
    "__EFFEEFFEE_____",
    "___EEEEEEEE_____",
    "___KEEEEEK______",
    "____FFFFFF______",
  ];
  const legs0 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "____SS__SS______",
  ];
  const legs1 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "_____SS_SS______",
  ];
  return [{ palette: P, data: [...head, ...body, ...legs0] }, { palette: P, data: [...head, ...body, ...legs1] }];
})();

// --- Challenger — cabelo ruivo, t-shirt vermelha ---
const [CHAR_CHALLENGER_0, CHAR_CHALLENGER_1] = (() => {
  const P = { _: null, H: '#c04020', K: '#d4956a', B: '#a06040', W: '#ffffff', E: '#c02020', F: '#901010', L: '#303030', S: '#505050' };
  const head = [
    "____HHHHHH______",
    "___HHHHHHHH_____",
    "__HHKKKKKKH_____",
    "__HKWBWKKKH_____",
    "__HKBKKKBKH_____",
    "__HKKKKKKKH_____",
    "___HKKKKKH______",
    "____HHHHHH______",
  ];
  const body = [
    "____EEEEEE______",
    "___EEEEEEE______",
    "__EKKKKKKKKE____",
    "__EEEEEEEEEE____",
    "__EFFEEFFEE_____",
    "___EEEEEEEE_____",
    "___KEEEEEK______",
    "____FFFFFF______",
  ];
  const legs0 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "____SS__SS______",
  ];
  const legs1 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "_____SS_SS______",
  ];
  return [{ palette: P, data: [...head, ...body, ...legs0] }, { palette: P, data: [...head, ...body, ...legs1] }];
})();

// --- Synthesizer — cabelo preto, blusa verde ---
const [CHAR_SYNTHESIZER_0, CHAR_SYNTHESIZER_1] = (() => {
  const P = { _: null, H: '#101010', K: '#f4c5a1', B: '#c0a080', W: '#ffffff', E: '#208040', F: '#105030', L: '#202828', S: '#304040' };
  const head = [
    "___HHHHHHHH_____",
    "__HHHHHHHHHH____",
    "_HHHKKKKKHHH____",
    "_HHKWBWKKHH_____",
    "_HHKBKKKBHH_____",
    "_HHHKKKKHH______",
    "__HHHKKHHH______",
    "____HHHH________",
  ];
  const body = [
    "____EEEEEE______",
    "___EEEEEEE______",
    "__EKKKKKKKKE____",
    "__EEEEEEEEEE____",
    "__EFFEEFFEE_____",
    "___EEEEEEEE_____",
    "___KEEEEEK______",
    "____FFFFFF______",
  ];
  const legs0 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "____SS__SS______",
  ];
  const legs1 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "_____SS_SS______",
  ];
  return [{ palette: P, data: [...head, ...body, ...legs0] }, { palette: P, data: [...head, ...body, ...legs1] }];
})();

// --- Backend Dev — cabelo castanho, hoodie cinzento ---
const [CHAR_BACKEND_DEV_0, CHAR_BACKEND_DEV_1] = (() => {
  const P = { _: null, H: '#6a3a10', K: '#f4c5a1', B: '#c0a080', W: '#ffffff', E: '#606060', F: '#404040', L: '#252525', S: '#484848' };
  const head = [
    "____HHHHHH______",
    "___HHHHHHH______",
    "__HHHKKKKKH_____",
    "__HHKWBWKKH_____",
    "__HHKBKKKBH_____",
    "__HHKKKKKH______",
    "___HHKKKH_______",
    "____HHHH________",
  ];
  const body = [
    "____EEEEEE______",
    "___EEEEEEE______",
    "__EKKKKKKKKE____",
    "__EEEEEEEEEE____",
    "__EFFEEFFEE_____",
    "___EEEEEEEE_____",
    "___KEEEEEK______",
    "____FFFFFF______",
  ];
  const legs0 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "____SS__SS______",
  ];
  const legs1 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "_____SS_SS______",
  ];
  return [{ palette: P, data: [...head, ...body, ...legs0] }, { palette: P, data: [...head, ...body, ...legs1] }];
})();

// --- Frontend Dev — cabelo rosa/roxo, camisola laranja ---
const [CHAR_FRONTEND_DEV_0, CHAR_FRONTEND_DEV_1] = (() => {
  const P = { _: null, H: '#c040c0', K: '#f4c5a1', B: '#c0a080', W: '#ffffff', E: '#e07020', F: '#b05010', L: '#302030', S: '#504050', R: '#ff80ff' };
  const head = [
    "___RHHHHHHH_____",
    "__RHHHHHHHH_____",
    "_RHHKKKKKRH_____",
    "_RHKWBWKRH______",
    "_RHKBKKKRH______",
    "_RHHKKKRH_______",
    "__RHHKRH________",
    "___RHH__________",
  ];
  const body = [
    "____EEEEEE______",
    "___EEEEEEE______",
    "__EKKKKKKKKE____",
    "__EEEEEEEEEE____",
    "__EFFEEFFEE_____",
    "___EEEEEEEE_____",
    "___KEEEEEK______",
    "____FFFFFF______",
  ];
  const legs0 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "____SS__SS______",
  ];
  const legs1 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "_____SS_SS______",
  ];
  return [{ palette: P, data: [...head, ...body, ...legs0] }, { palette: P, data: [...head, ...body, ...legs1] }];
})();

// --- DBA — quase careca, camisa amarela ---
const [CHAR_DBA_0, CHAR_DBA_1] = (() => {
  const P = { _: null, H: '#c8a060', K: '#a06030', B: '#805020', W: '#ffffff', E: '#d0c020', F: '#a09010', L: '#202828', S: '#304040' };
  const head = [
    "____HHHHHH______",
    "___HKKKKKH______",
    "__HKKKKKKH______",
    "__HKWBWKKH______",
    "__HKBKKKBH______",
    "__HKKKKKH_______",
    "___HKKKH________",
    "____HHH_________",
  ];
  const body = [
    "____EEEEEE______",
    "___EEEEEEE______",
    "__EKKKKKKKKE____",
    "__EEEEEEEEEE____",
    "__EFFEEFFEE_____",
    "___EEEEEEEE_____",
    "___KEEEEEK______",
    "____FFFFFF______",
  ];
  const legs0 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "____SS__SS______",
  ];
  const legs1 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "_____SS_SS______",
  ];
  return [{ palette: P, data: [...head, ...body, ...legs0] }, { palette: P, data: [...head, ...body, ...legs1] }];
})();

// --- DevOps — cabelo escuro, fato de macaco cinzento ---
const [CHAR_DEVOPS_0, CHAR_DEVOPS_1] = (() => {
  const P = { _: null, H: '#202020', K: '#f4c5a1', B: '#c0a080', W: '#ffffff', E: '#808090', F: '#606070', L: '#707080', S: '#909098' };
  const head = [
    "____HHHHHH______",
    "___HHHHHHHH_____",
    "__HHHKKKKHH_____",
    "__HHKWBWKKH_____",
    "__HHKBKKKBH_____",
    "__HHKKKKKH______",
    "___HHKKKH_______",
    "____HHHH________",
  ];
  const body = [
    "____EEEEEE______",
    "___EEEEEEE______",
    "__EKKKKKKKKE____",
    "__EEEEEEEEEE____",
    "__EFFEEFFEE_____",
    "___EEEEEEEE_____",
    "___KEEEEEK______",
    "____FFFFFF______",
  ];
  const legs0 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "____SS__SS______",
  ];
  const legs1 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "_____SS_SS______",
  ];
  return [{ palette: P, data: [...head, ...body, ...legs0] }, { palette: P, data: [...head, ...body, ...legs1] }];
})();

// --- QA — cabelo claro, polo verde ---
const [CHAR_QA_0, CHAR_QA_1] = (() => {
  const P = { _: null, H: '#d8c870', K: '#f4c5a1', B: '#c0a080', W: '#ffffff', E: '#308060', F: '#206040', L: '#303030', S: '#484848', Y: '#f0e890' };
  const head = [
    "___YYHHHHHYY____",
    "__YYHHHHHHHYY___",
    "__YYHKKKKKHY____",
    "__YYHKWBWKHY____",
    "__YYHKBKKKHY____",
    "__YYHHKKKHY_____",
    "___YHHKKHYY_____",
    "____YYYY________",
  ];
  const body = [
    "____EEEEEE______",
    "___EEEEEEE______",
    "__EKKKKKKKKE____",
    "__EEEEEEEEEE____",
    "__EFFEEFFEE_____",
    "___EEEEEEEE_____",
    "___KEEEEEK______",
    "____FFFFFF______",
  ];
  const legs0 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "____SS__SS______",
  ];
  const legs1 = [
    "____LLLLLL______",
    "____LSSSSL______",
    "____LLLLLL______",
    "____LLLLLL______",
    "____SSSSSS______",
    "____SSSSSS______",
    "____SS__SS______",
    "_____SS_SS______",
  ];
  return [{ palette: P, data: [...head, ...body, ...legs0] }, { palette: P, data: [...head, ...body, ...legs1] }];
})();

// =============================================================================
// EXPORT
// =============================================================================

export const SPRITES = {
  // Piso
  FLOOR_WOOD,
  FLOOR_BLUE,
  FLOOR_LIGHT,

  // Parede
  WALL_TOP,

  // Mobília/objectos
  COMPUTER,
  CHAIR,
  BOOKSHELF,
  PLANT,
  CLOCK,
  WATER_COOLER,

  // Personagens — 2 frames
  CHAR_DISCOVERY_0,
  CHAR_DISCOVERY_1,
  CHAR_ARCHITECT_0,
  CHAR_ARCHITECT_1,
  CHAR_CHALLENGER_0,
  CHAR_CHALLENGER_1,
  CHAR_SYNTHESIZER_0,
  CHAR_SYNTHESIZER_1,
  CHAR_BACKEND_DEV_0,
  CHAR_BACKEND_DEV_1,
  CHAR_FRONTEND_DEV_0,
  CHAR_FRONTEND_DEV_1,
  CHAR_DBA_0,
  CHAR_DBA_1,
  CHAR_DEVOPS_0,
  CHAR_DEVOPS_1,
  CHAR_QA_0,
  CHAR_QA_1,
};
