// Small drawings for the app's own controls. Lesson pictures stay as emoji in the data.
const svg = (box, body) => `<svg viewBox="0 0 ${box} ${box}" aria-hidden="true" fill="none" stroke="#2b201a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
// A single-storey "a" centred on (x, y), in the vowel colour.
const a = (x, y) => `<path stroke="#b9472a" stroke-width="3" d="M${x + 5} ${y - 6}v12M${x - 4.6} ${y}a4.6 4.6 0 1 0 9.2 0a4.6 4.6 0 1 0-9.2 0"/>`;

// The header mark: a marigold bead with an "a".
export const MARK = svg(32, `<circle cx="16" cy="16" r="16" fill="#f2b33d" stroke="none"/><path stroke-width="3" d="M20.5 10.8v12.6M9.2 17.2a5.4 5.4 0 1 0 10.8 0a5.4 5.4 0 1 0-10.8 0"/>`);

export const GAMES = {
  cards: svg(64, `<rect x="9" y="15" width="25" height="35" rx="5" fill="#f8dfd4" transform="rotate(-15 21 32)"/><rect x="30" y="15" width="25" height="35" rx="5" fill="#e2eee5" transform="rotate(15 42 32)"/><rect x="19.5" y="11" width="25" height="37" rx="5" fill="#fffcf6"/>${a(30.5, 30)}`),
  // Tiles spelling c-a-t.
  tiles: svg(64, `<rect x="3" y="24" width="18" height="19" rx="4" fill="#fcecc6"/><rect x="23" y="19" width="18" height="19" rx="4" fill="#fffcf6"/><rect x="43" y="24" width="18" height="19" rx="4" fill="#e3e7f7"/><path stroke-width="3" d="M15 30.5a4 4 0 1 0 0 6M52 28v10q0 2 3 2M49 31.5h6"/>${a(30.5, 28.5)}`),
};

const face = (fill, mouth) => svg(48, `<circle cx="24" cy="24" r="21" fill="${fill}"/><path stroke-width="3" d="M17 18v4M31 18v4M${mouth}"/>`).replace('<svg', '<svg class="face"');
export const FACES = { keen: face('#f2b33d', '14 28q10 10 20 0'), ok: face('#dcefe1', '16 30q8 4 16 0'), low: face('#e3e7f7', '16 33q8-4 16 0') };
