// How the app works: docs/how-it-works.md.
import { docHtml } from '../docs.js';

export function viewHow() {
  return `<section class="card prose doc how">${docHtml('how-it-works.md', 'How Early Reader works')}</section>`;
}

export const actions = {};
export const forms = {};
