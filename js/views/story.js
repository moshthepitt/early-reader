import * as RA from '../readaloud.js';
import * as store from '../store.js';
import { escapeHtml as h } from '../util.js';
import { state, ui, persist, today } from '../ui.js';
import { docHtml } from '../docs.js';

export function viewStory() {
  const saved = state.books
    .map(
      (b) => `<details class="book"><summary>${h(b.title)}</summary><pre class="prompts">${h(b.notes || '')}</pre>
      <button class="btn ghost small danger" data-action="delete-book" data-id="${h(b.id)}">Remove</button></details>`,
    )
    .join('');
  return `<section class="card">
      <h1>Story time</h1>
      <p>Story time builds vocabulary through talk and stories. It matters as much as letters. Both children can join in.</p>
      <ul>${RA.TIPS.map((t) => `<li>${h(t)}</li>`).join('')}</ul>
    </section>
    <section class="card prose doc books">${docHtml('books.md', 'Books to read aloud')}</section>
    <section class="card">
      <h2>The question loop (PEER)</h2>
      <ol>${RA.PEER.map((p) => `<li><b>${h(p.step)}:</b> ${h(p.text)}</li>`).join('')}</ol>
      <h3>Question types (CROWD)</h3>
      <ul>${RA.CROWD.map((q) => `<li><b>${h(q.type)}:</b> ${h(q.example)} <span class="muted small">Best for: ${h(q.best)}</span></li>`).join('')}</ul>
    </section>
    <section class="card">
      <h2>Point to the words</h2>
      <p class="muted small">Young children look at the words less than 5% of the time unless you point them out.</p>
      <ul>${RA.PRINT_POINTERS.map((t) => `<li>${h(t)}</li>`).join('')}</ul>
      <h3>Sound games with the book</h3>
      <ul>${RA.SOUND_PROMPTS.map((t) => `<li>${h(t)}</li>`).join('')}</ul>
    </section>
    <form class="card" data-form="book-prompt">
      <h2>Prepare questions for a book</h2>
      <p>Make a prompt to paste into any AI chat tool. It asks for questions for this book. It includes only what you type below, with your children's names removed. Do not add other personal details.</p>
      <label>Book title <input name="title" required maxlength="140"></label>
      <label>Author (optional) <input name="author" maxlength="80"></label>
      <label>What happens on each page (optional, helps with the questions) <textarea name="notes" rows="3" maxlength="2500"></textarea></label>
      <button class="btn primary">Make prompt</button>
      ${ui.bookPrompt ? `<textarea class="prompt-out" readonly rows="10">${h(ui.bookPrompt)}</textarea><button type="button" class="btn" data-action="copy" data-target=".prompt-out">Copy</button>` : ''}
    </form>
    <form class="card" data-form="save-book">
      <h2>Save questions for a book</h2>
      <p class="muted small">Paste the questions you got back, or your own, to save them for bedtime. Read them over first - AI can get book details wrong.</p>
      <label>Book title <input name="title" required maxlength="140"></label>
      <label>Questions <textarea name="notes" rows="6" maxlength="8000" required></textarea></label>
      <button class="btn">Save</button>
    </form>
    ${saved ? `<section class="card"><h2>Saved books</h2>${saved}</section>` : ''}`;
}

export const actions = {
  'delete-book': (el) => {
    state.books = state.books.filter((b) => b.id !== el.dataset.id);
    persist();
  },
};

export const forms = {
  'book-prompt': (f, data) => {
    ui.bookPrompt = RA.buildBookPrompt({ title: data.get('title'), author: data.get('author'), pageNotes: data.get('notes'), redact: store.familyNames(state) });
  },
  'save-book': (f, data) => {
    state.books.unshift({ id: Math.random().toString(36).slice(2), title: String(data.get('title')).slice(0, 140), notes: String(data.get('notes')).slice(0, 8000), created: today() });
    persist();
    f.reset();
  },
};
