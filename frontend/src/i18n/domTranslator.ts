/**
 * In-place DOM translator.
 *
 * Translates the visible English text of the page without editing any component.
 * Rules that keep React working:
 *  - Only the `data` of existing text nodes and the value of existing attributes are
 *    changed. Nodes are never replaced, wrapped or moved.
 *  - The English original of every node we change is kept in a WeakMap. When React
 *    later writes new text into a node we changed, we see that the node no longer
 *    holds what we wrote, treat the new text as the new English original, and
 *    translate it again.
 *  - Our own writes happen while the MutationObserver is disconnected, so they never
 *    loop back. The observer callback runs as a microtask, before the browser paints,
 *    so newly rendered text is translated without a flash of English.
 */
import { isAcronym, isTranslatable, lookupKey, translateText, type Lookup } from './textRules';

const TRANSLATED_ATTRIBUTES = ['placeholder', 'aria-label', 'title', 'alt'] as const;
const BUTTON_INPUT_TYPES = new Set(['button', 'submit', 'reset']);
// Content that is code, user-edited or marked by us as "leave alone".
const EXCLUDED =
  '[data-no-translate],[translate="no"],script,style,noscript,code,pre,textarea,[contenteditable]:not([contenteditable="false"])';
const OBSERVED_ATTRIBUTES = [...TRANSLATED_ATTRIBUTES, 'value'];

export interface DomTranslatorOptions {
  root: HTMLElement;
  /** Bundled dictionary first, then cached server results. */
  lookup: Lookup;
  /** Called with normalised text that no lookup knows. */
  request: (text: string) => void;
  /** False while translation must be off (for example inside the admin portal). */
  isEnabled: () => boolean;
  /** False when unknown text must not be sent to the server (pages with personal data). */
  canRequest: () => boolean;
}

export interface DomTranslator {
  start(): void;
  /** Restore the English text and stop watching. */
  stop(): void;
  /** Translate everything again, for example after new translations arrived. */
  refresh(): void;
}

interface Entry {
  original: string;
  written: string;
}

export function createDomTranslator(options: DomTranslatorOptions): DomTranslator {
  const { root, lookup, request, isEnabled, canRequest } = options;
  const textEntries = new WeakMap<Text, Entry>();
  const attributeEntries = new WeakMap<Element, Map<string, Entry>>();
  let active = false;
  let started = false;
  const observer = new MutationObserver(onMutations);

  function observe() {
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: OBSERVED_ATTRIBUTES,
    });
  }

  /** Decide the new text for a string we may have translated before. */
  function resolve(current: string, entry: Entry | undefined): { original: string; next: string } {
    // If the node still holds our write, the English original is the stored one.
    // Otherwise React changed it, and what it holds now is the new original.
    const original = entry && current === entry.written ? entry.original : current;
    const next = translateText(original, lookup);
    if (next === undefined) {
      if (canRequest() && isTranslatable(original) && !isAcronym(original)) request(lookupKey(original));
      return { original, next: original };
    }
    return { original, next };
  }

  function translateTextNode(node: Text) {
    const entry = textEntries.get(node);
    const { original, next } = resolve(node.data, entry);
    if (next !== node.data) node.data = next;
    if (next === original) textEntries.delete(node);
    else textEntries.set(node, { original, written: next });
  }

  function translateAttributes(element: Element) {
    const names: string[] = [...TRANSLATED_ATTRIBUTES];
    if (element instanceof HTMLInputElement && BUTTON_INPUT_TYPES.has(element.type)) names.push('value');
    for (const name of names) {
      const current = element.getAttribute(name);
      if (current === null) continue;
      const entries = attributeEntries.get(element) ?? new Map<string, Entry>();
      const { original, next } = resolve(current, entries.get(name));
      if (next !== current) element.setAttribute(name, next);
      if (next === original) entries.delete(name);
      else entries.set(name, { original, written: next });
      if (entries.size) attributeEntries.set(element, entries);
      else attributeEntries.delete(element);
    }
  }

  function restoreTextNode(node: Text) {
    const entry = textEntries.get(node);
    if (entry && node.data === entry.written) node.data = entry.original;
    textEntries.delete(node);
  }

  function restoreAttributes(element: Element) {
    const entries = attributeEntries.get(element);
    if (!entries) return;
    for (const [name, entry] of entries) {
      if (element.getAttribute(name) === entry.written) element.setAttribute(name, entry.original);
    }
    attributeEntries.delete(element);
  }

  /** Visit a node and everything below it, skipping excluded subtrees. */
  function walk(node: Node, onText: (text: Text) => void, onElement: (element: Element) => void) {
    if (node.nodeType === Node.TEXT_NODE) {
      onText(node as Text);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      if (element.matches(EXCLUDED)) {
        // A textarea's text is never touched, but its placeholder is interface text.
        if (element.tagName === 'TEXTAREA') onElement(element);
        return;
      }
      onElement(element);
      element.childNodes.forEach((child) => walk(child, onText, onElement));
    }
  }

  const isInsideExcluded = (node: Node) => Boolean(node.parentElement?.closest(EXCLUDED));

  function translateSubtree(node: Node) {
    if (isInsideExcluded(node)) return;
    walk(node, translateTextNode, translateAttributes);
  }

  function restoreAll() {
    walk(root, restoreTextNode, restoreAttributes);
  }

  function paused(work: () => void) {
    observer.disconnect();
    try {
      work();
    } finally {
      if (started) observe();
    }
  }

  function onMutations(records: MutationRecord[]) {
    paused(() => {
      if (!isEnabled()) {
        if (active) restoreAll();
        active = false;
        return;
      }
      if (!active) {
        // Came back from a disabled route: translate the whole page again.
        active = true;
        translateSubtree(root);
        return;
      }
      for (const record of records) {
        if (record.type === 'characterData') {
          if (record.target.nodeType === Node.TEXT_NODE && !isInsideExcluded(record.target)) {
            translateTextNode(record.target as Text);
          }
        } else if (record.type === 'attributes') {
          const element = record.target as Element;
          // A textarea is excluded for its text only: its placeholder is still interface text.
          const excluded = element.matches(EXCLUDED) && element.tagName !== 'TEXTAREA';
          if (!excluded && !isInsideExcluded(element)) translateAttributes(element);
        } else {
          record.addedNodes.forEach(translateSubtree);
        }
      }
    });
  }

  return {
    start() {
      if (started) return;
      started = true;
      active = isEnabled();
      paused(() => {
        if (active) translateSubtree(root);
      });
    },
    stop() {
      if (!started) return;
      observer.disconnect();
      started = false;
      active = false;
      restoreAll();
    },
    refresh() {
      if (!started) return;
      active = isEnabled();
      paused(() => {
        if (active) translateSubtree(root);
      });
    },
  };
}
