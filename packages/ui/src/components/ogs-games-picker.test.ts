import { afterEach, describe, expect, test, vi } from 'vitest';
import './ogs-games-picker.ts';
import type { OgsGamesPicker, GameOption } from './ogs-games-picker.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAMPLE_GAMES: GameOption[] = [
  { categoryId: 1, name: 'Magic', displayName: 'Magic: The Gathering' },
  { categoryId: 3, name: 'Pokemon', displayName: 'Pokemon' },
  { categoryId: 5, name: 'OnePiece', displayName: 'One Piece Card Game' },
  { categoryId: 7, name: 'Lorcana', displayName: 'Disney Lorcana' },
];

function createPicker(games: GameOption[] = SAMPLE_GAMES, selectedCategoryIds: number[] = []): OgsGamesPicker {
  const el = document.createElement('ogs-games-picker') as OgsGamesPicker;
  el.games = games;
  el.selectedCategoryIds = selectedCategoryIds;
  document.body.appendChild(el);
  return el;
}

async function waitForUpdate(el: OgsGamesPicker) {
  await el.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ogs-games-picker', () => {
  let picker: OgsGamesPicker;

  afterEach(() => {
    picker?.remove();
    vi.clearAllMocks();
  });

  // --- Rendering ---

  describe('rendering', () => {
    test('should render checkboxes for all games', async () => {
      picker = createPicker();
      await waitForUpdate(picker);

      const checkboxes = picker.shadowRoot!.querySelectorAll('wa-checkbox');
      expect(checkboxes.length).toBe(4);

      const labels = Array.from(checkboxes).map((cb) => cb.textContent?.trim());
      expect(labels).toContain('Magic: The Gathering');
      expect(labels).toContain('Pokemon');
      expect(labels).toContain('One Piece Card Game');
      expect(labels).toContain('Disney Lorcana');
    });

    test('should check selected games', async () => {
      picker = createPicker(SAMPLE_GAMES, [1, 5]);
      await waitForUpdate(picker);

      const checkboxes = picker.shadowRoot!.querySelectorAll('wa-checkbox');
      const checkedLabels = Array.from(checkboxes)
        .filter((cb) => cb.hasAttribute('checked'))
        .map((cb) => cb.textContent?.trim());

      expect(checkedLabels).toContain('Magic: The Gathering');
      expect(checkedLabels).toContain('One Piece Card Game');
      expect(checkedLabels).not.toContain('Pokemon');
      expect(checkedLabels).not.toContain('Disney Lorcana');
    });

    test('should display selection count', async () => {
      picker = createPicker(SAMPLE_GAMES, [1, 3]);
      await waitForUpdate(picker);

      const count = picker.shadowRoot!.querySelector('.games-count');
      expect(count?.textContent).toContain('2 of 4 selected');
    });

    test('should render search input', async () => {
      picker = createPicker();
      await waitForUpdate(picker);

      const input = picker.shadowRoot!.querySelector('wa-input[placeholder="Search games..."]');
      expect(input).toBeTruthy();
    });

    test('should render select all and deselect all buttons', async () => {
      picker = createPicker();
      await waitForUpdate(picker);

      const buttons = picker.shadowRoot!.querySelectorAll('.toolbar-actions wa-button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent?.trim()).toContain('Select all');
      expect(buttons[1].textContent?.trim()).toContain('Deselect all');
    });
  });

  // --- Empty state ---

  describe('empty state', () => {
    test('should show default empty message when no games provided', async () => {
      picker = createPicker([]);
      await waitForUpdate(picker);

      expect(picker.shadowRoot!.textContent).toContain('No game categories available');
      const checkboxes = picker.shadowRoot!.querySelectorAll('wa-checkbox');
      expect(checkboxes.length).toBe(0);
    });

    test('should render slotted empty content when provided', async () => {
      picker = document.createElement('ogs-games-picker') as OgsGamesPicker;
      picker.games = [];
      picker.innerHTML = '<div slot="empty">Custom empty message</div>';
      document.body.appendChild(picker);
      await waitForUpdate(picker);

      const slot = picker.shadowRoot!.querySelector('slot[name="empty"]') as HTMLSlotElement;
      expect(slot).toBeTruthy();
      const assigned = slot.assignedElements();
      expect(assigned.length).toBe(1);
      expect(assigned[0].textContent).toContain('Custom empty message');
    });
  });

  // --- Search / filtering ---

  describe('search filtering', () => {
    test('should filter games by search term', async () => {
      picker = createPicker();
      await waitForUpdate(picker);

      const input = picker.shadowRoot!.querySelector('wa-input') as unknown as HTMLInputElement;
      input.value = 'magic';
      input.dispatchEvent(new Event('input'));
      await waitForUpdate(picker);

      const checkboxes = picker.shadowRoot!.querySelectorAll('wa-checkbox');
      expect(checkboxes.length).toBe(1);
      expect(checkboxes[0].textContent?.trim()).toContain('Magic: The Gathering');
    });

    test('should show empty message when search has no matches', async () => {
      picker = createPicker();
      await waitForUpdate(picker);

      const input = picker.shadowRoot!.querySelector('wa-input') as unknown as HTMLInputElement;
      input.value = 'zzzznonexistent';
      input.dispatchEvent(new Event('input'));
      await waitForUpdate(picker);

      const empty = picker.shadowRoot!.querySelector('.games-empty');
      expect(empty).toBeTruthy();
      expect(empty?.textContent).toContain('No games match your search');
    });
  });

  // --- Events ---

  describe('events', () => {
    test('should emit ogs-games-change when toggling a game on', async () => {
      picker = createPicker(SAMPLE_GAMES, [1]);
      await waitForUpdate(picker);

      const handler = vi.fn();
      picker.addEventListener('ogs-games-change', handler as EventListener);

      const checkboxes = picker.shadowRoot!.querySelectorAll('wa-checkbox');
      // Find the unchecked Pokemon checkbox
      const pokemonCb = Array.from(checkboxes).find((cb) => cb.textContent?.trim() === 'Pokemon');
      expect(pokemonCb).toBeTruthy();

      Object.defineProperty(pokemonCb, 'checked', { value: true, writable: true });
      pokemonCb!.dispatchEvent(new Event('change'));
      await waitForUpdate(picker);

      expect(handler).toHaveBeenCalledOnce();
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.categoryIds).toContain(1);
      expect(detail.categoryIds).toContain(3);
    });

    test('should emit ogs-games-change when toggling a game off', async () => {
      picker = createPicker(SAMPLE_GAMES, [1, 3]);
      await waitForUpdate(picker);

      const handler = vi.fn();
      picker.addEventListener('ogs-games-change', handler as EventListener);

      const checkboxes = picker.shadowRoot!.querySelectorAll('wa-checkbox');
      const pokemonCb = Array.from(checkboxes).find((cb) => cb.textContent?.trim() === 'Pokemon');
      expect(pokemonCb).toBeTruthy();

      Object.defineProperty(pokemonCb, 'checked', { value: false, writable: true });
      pokemonCb!.dispatchEvent(new Event('change'));
      await waitForUpdate(picker);

      expect(handler).toHaveBeenCalledOnce();
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.categoryIds).toContain(1);
      expect(detail.categoryIds).not.toContain(3);
    });

    test('should not produce duplicate categoryIds when toggling on', async () => {
      picker = createPicker(SAMPLE_GAMES, [1]);
      await waitForUpdate(picker);

      const handler = vi.fn();
      picker.addEventListener('ogs-games-change', handler as EventListener);

      const checkboxes = picker.shadowRoot!.querySelectorAll('wa-checkbox');
      // Toggle Magic on again (already selected)
      const magicCb = Array.from(checkboxes).find((cb) => cb.textContent?.includes('Magic'));
      Object.defineProperty(magicCb, 'checked', { value: true, writable: true });
      magicCb!.dispatchEvent(new Event('change'));
      await waitForUpdate(picker);

      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      const magicOccurrences = detail.categoryIds.filter((id: number) => id === 1);
      expect(magicOccurrences.length).toBe(1);
    });
  });

  // --- Button states ---

  describe('button states', () => {
    test('should disable select all when all filtered games are selected', async () => {
      picker = createPicker(SAMPLE_GAMES, [1, 3, 5, 7]);
      await waitForUpdate(picker);

      const selectAllBtn = picker.shadowRoot!.querySelectorAll('.toolbar-actions wa-button')[0];
      expect(selectAllBtn.hasAttribute('disabled')).toBe(true);
    });

    test('should disable deselect all when no filtered games are selected', async () => {
      picker = createPicker(SAMPLE_GAMES, []);
      await waitForUpdate(picker);

      const deselectAllBtn = picker.shadowRoot!.querySelectorAll('.toolbar-actions wa-button')[1];
      expect(deselectAllBtn.hasAttribute('disabled')).toBe(true);
    });

    test('should enable both buttons when some but not all games are selected', async () => {
      picker = createPicker(SAMPLE_GAMES, [1, 3]);
      await waitForUpdate(picker);

      const buttons = picker.shadowRoot!.querySelectorAll('.toolbar-actions wa-button');
      expect(buttons[0].hasAttribute('disabled')).toBe(false); // Select all
      expect(buttons[1].hasAttribute('disabled')).toBe(false); // Deselect all
    });
  });
});
