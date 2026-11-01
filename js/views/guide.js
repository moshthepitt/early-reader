// The parent guide: docs/parents-guide.md.
import { docHtml } from '../docs.js';

export function viewGuide() {
  return `<section class="card prose doc guide">${docHtml('parents-guide.md', "A parent's guide to Early Reader")}</section>`;
}

export const actions = {};
export const forms = {};
