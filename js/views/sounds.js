import * as G from '../data/en.js';
import * as audio from '../audio.js';
import { escapeHtml as h } from '../util.js';
import { ui, rerender } from '../ui.js';

export function viewSounds() {
  const can = audio.canRecord();
  const rows = G.BASE_ORDER.map((g) => {
    const x = G.GRAPHEME_MAP[g];
    const has = ui.recorded.has(g);
    const rec = ui.recording === g;
    return `<div class="sound-row">
      <div class="sr-letter">${h(g)}</div>
      <div class="sr-info"><b>${h(x.say)}</b> ${h(x.emoji)} ${h(x.keyword)}${x.digraph ? '' : ` · name: "${h(x.name)}"`}<br><span class="muted small">${h(x.tip)}</span></div>
      <div class="sr-btns">${
        can
          ? `<button class="btn small ${rec ? 'warn' : ''}" data-action="${rec ? 'rec-stop' : 'rec-start'}" data-g="${h(g)}" ${ui.recording && !rec ? 'disabled' : ''}>${rec ? 'Stop' : has ? 'Re-record' : 'Record'}</button>
             ${has ? `<button class="btn small" data-action="rec-play" data-g="${h(g)}" ${ui.recording ? 'disabled' : ''}>Play</button>` : ''}`
          : ''
      }</div>
    </div>`;
  }).join('');
  return `<section class="card">
      <h1>How to say each sound</h1>
      <p>Say sounds short and clean. A common slip is adding "uh": say "mmm", not "muh"; a quick "t", not "tuh". Stretch sounds you can hold (s, m, f, l, n, v, z, sh and the vowels) when blending: "mmmaaat".</p>
      ${
        can
          ? '<p>Record yourself saying each sound, then play it back to check for an "uh". Recordings stay on this device.</p>'
          : '<p class="notice">Recording needs a secure page (https or localhost) and a browser with microphone support.</p>'
      }
    </section>
    <section class="card">${rows}</section>`;
}

export async function refreshRecorded() {
  try {
    const keys = await audio.listRecordings();
    ui.recorded = new Set(keys);
  } catch {
    ui.recorded = new Set();
  }
}

export const actions = {
  'rec-start': async (el) => {
    const g = el.dataset.g;
    if (ui.recording || audio.isRecording()) return false;
    ui.recording = g;
    rerender();
    try {
      const blob = await audio.startRecording();
      if (blob) {
        await audio.saveRecording(g, blob);
        ui.recorded.add(g);
      }
    } catch (err) {
      alert('Could not record. Check that your browser has permission to use the microphone.');
    }
    ui.recording = null;
    rerender();
    return false;
  },
  'rec-stop': () => {
    audio.stopRecording();
    return false;
  },
  'rec-play': (el) => {
    audio.play(el.dataset.g);
    return false;
  },
};
