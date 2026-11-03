import * as store from '../store.js';
import * as audio from '../audio.js';
import { state, setState, ui, today, persist, render, notify } from '../ui.js';
import { refreshRecorded } from './sounds.js';

export function viewSettings() {
  return `<form class="card" data-form="settings">
      <h1>Settings</h1>
      <label>New letters per week
        <select name="newPerWeek">${[2, 3, 4].map((n) => `<option ${state.settings.newPerWeek === n ? 'selected' : ''}>${n}</option>`).join('')}</select>
      </label>
      <label>New tricky words per week
        <select name="trickyPerWeek">${[1, 2, 3].map((n) => `<option ${state.settings.trickyPerWeek === n ? 'selected' : ''}>${n}</option>`).join('')}</select>
      </label>
      <p class="muted small">The app waits before adding more when fewer than about 75% of recent answers were right, or when 3 items are still being learned.</p>
      <button class="btn primary">Save</button>
    </form>
    <section class="card">
      <h2>Your data</h2>
      <p>Everything you enter is saved on this device, in this browser. There is no Early Reader server and no account, so nothing is ever uploaded. That also means clearing your browser data deletes it, so export a backup now and then.</p>
      <div class="row">
        <button class="btn" data-action="export">Export backup</button>
        <label class="btn">Import backup<input type="file" accept="application/json" data-change="import" hidden></label>
      </div>
      <p class="muted small">Backups include voice recordings. Importing replaces the data on this device. You can undo the last import or delete.</p>
      ${store.hasSnapshot() ? '<button class="btn ghost" data-action="undo-replace">Undo last import or delete</button>' : ''}
      <button class="btn ghost danger" data-action="reset">Delete all data (children, progress, settings and recordings)</button>
    </section>`;
}

export async function importBackup(el) {
  const file = el.files[0];
  if (!file) return;
  try {
    // Validate fully before touching saved data, and keep a copy to undo.
    const { state: incoming, recordings } = store.importJson(await file.text());
    if (!confirm(`Replace the data on this device with this backup (${incoming.children.length} ${incoming.children.length === 1 ? 'child' : 'children'})?`)) return;
    store.snapshot();
    const before = state;
    setState({ ...incoming, rev: state.rev });
    try {
      if (!persist()) return;
    } catch (err) {
      // Not saved (the phone may be full): keep showing what is really saved.
      setState(before);
      throw err;
    }
    let recordingsSaved = true;
    try {
      await audio.importRecordings(recordings);
    } catch {
      recordingsSaved = false;
    }
    await refreshRecorded();
    render();
    if (recordingsSaved) notify('Backup restored.');
    else alert("Backup restored, but the voice recordings in it couldn't be saved on this device. You can record them again on the Sounds tab.");
  } catch (err) {
    alert(err.message);
  } finally {
    el.value = '';
  }
}

export const actions = {
  export: async () => {
    let recordings = {};
    let recordingsMissing = false;
    try {
      recordings = await audio.exportRecordings();
    } catch {
      // Only worth a warning if there were recordings to lose. The list is read when
      // the app opens; where the recordings store can't open, it stays empty.
      recordingsMissing = ui.recorded.size > 0;
    }
    const blob = new Blob([store.exportJson(state, recordings)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `early-reader-backup-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    if (recordingsMissing) alert("Backup file downloaded, but without your voice recordings: they couldn't be read. Everything else is in it. Keep it somewhere safe.");
    else notify('Backup file downloaded. Keep it somewhere safe.');
    return false;
  },
  reset: async () => {
    if (!confirm('Delete all children, progress, settings and voice recordings from this device? If you are unsure, export a backup first.')) return false;
    store.snapshot();
    setState({ ...store.defaultState(), rev: state.rev });
    if (!persist()) return false;
    try {
      await audio.clearRecordings();
    } catch {
      // No recordings database yet.
    }
    ui.recorded = new Set();
    render();
    notify('Everything on this device was deleted.');
    return false;
  },
  'undo-replace': () => {
    const prev = store.restoreSnapshot();
    const day = store.snapshotDay();
    if (!prev || !confirm(`Go back to the data from before the last import or delete${day ? ` (${day})` : ''}? What is here now is kept, so the same button can swap it back.`)) return false;
    // Keep what is here now, so undo can't lose anything done since the import.
    store.snapshot();
    setState({ ...prev, rev: state.rev });
    if (!persist()) return false;
    notify('The earlier data is back.');
  },
};

export const forms = {
  settings: (f, data) => {
    state.settings.newPerWeek = Number(data.get('newPerWeek'));
    state.settings.trickyPerWeek = Number(data.get('trickyPerWeek'));
    if (!persist()) return false;
    notify('Settings saved.');
  },
};
