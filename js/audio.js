// Parent voice recordings for each sound, stored on this device in IndexedDB.
//
// Why record yourself: computer voices say isolated sounds badly, and parents tend to add
// "uh" to sounds (McConnell & Kubina 2016). Recording and listening back helps you hear it.
// Recordings never leave the device unless you export a backup.

const DB = 'early-reader-audio';
const STORE = 'sounds';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => {
      db.close();
      resolve(req && 'result' in req ? req.result : undefined);
    };
    t.onerror = () => {
      db.close();
      reject(t.error);
    };
  });
}

export const saveRecording = (key, blob) => tx('readwrite', (s) => s.put(blob, key));
const getRecording = (key) => tx('readonly', (s) => s.get(key));
export const listRecordings = () => tx('readonly', (s) => s.getAllKeys());
export const clearRecordings = () => tx('readwrite', (s) => s.clear());

export function canRecord() {
  return !!(navigator.mediaDevices && window.MediaRecorder && window.isSecureContext);
}

// One recording at a time. The microphone is always released when it stops.
let current = null;

export function isRecording() {
  return !!current;
}

export async function startRecording(maxMs = 3000) {
  if (current) throw new Error('Already recording.');
  current = { pending: true };
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    current = null;
    throw err;
  }
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise((resolve) => {
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      current = null;
      resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
    };
  });
  current = { rec, stream, done };
  rec.start();
  setTimeout(() => rec.state === 'recording' && rec.stop(), maxMs);
  return done;
}

export function stopRecording() {
  if (current && current.rec && current.rec.state === 'recording') current.rec.stop();
}

export async function play(key) {
  const blob = await getRecording(key);
  if (!blob) return false;
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => URL.revokeObjectURL(url);
  await audio.play();
  return true;
}

// For backups: recordings as data URLs.
export async function exportRecordings() {
  const out = {};
  for (const key of await listRecordings()) {
    const blob = await getRecording(key);
    if (blob) out[key] = await blobToDataUrl(blob);
  }
  return out;
}

export async function importRecordings(map) {
  for (const [key, url] of Object.entries(map || {})) {
    const blob = await (await fetch(url)).blob();
    await saveRecording(key, blob);
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
