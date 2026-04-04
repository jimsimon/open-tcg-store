import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import './ogs-wizard';
import type { OgsWizard, OgsWizardItem } from './ogs-wizard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWizard(stepCount = 3): { wizard: OgsWizard; steps: OgsWizardItem[] } {
  const wizard = document.createElement('ogs-wizard') as OgsWizard;
  const steps: OgsWizardItem[] = [];

  for (let i = 0; i < stepCount; i++) {
    const step = document.createElement('ogs-wizard-item') as OgsWizardItem;
    step.heading = `Step ${i + 1}`;
    step.innerHTML = `<input type="text" placeholder="Step ${i + 1} input" />`;
    wizard.appendChild(step);
    steps.push(step);
  }

  document.body.appendChild(wizard);
  return { wizard, steps };
}

async function waitForUpdate(element: { updateComplete: Promise<boolean> }) {
  await element.updateComplete;
  // Allow an extra microtask for slot assignment
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ogs-wizard', () => {
  let wizard: OgsWizard;
  let steps: OgsWizardItem[];

  afterEach(() => {
    wizard?.remove();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the wizard element', async () => {
      ({ wizard, steps } = createWizard());
      await waitForUpdate(wizard);

      expect(wizard.shadowRoot).not.toBeNull();
      expect(wizard.shadowRoot!.querySelector('wa-card')).not.toBeNull();
    });

    it('should render a slot for wizard items', async () => {
      ({ wizard, steps } = createWizard());
      await waitForUpdate(wizard);

      const slot = wizard.shadowRoot!.querySelector('slot');
      expect(slot).not.toBeNull();
    });
  });

  describe('navigation', () => {
    beforeEach(async () => {
      ({ wizard, steps } = createWizard(3));
      await waitForUpdate(wizard);
    });

    it('should start at index 0', () => {
      expect(wizard.activeIndex).toBe(0);
    });

    it('should advance to next step', () => {
      wizard.next();
      expect(wizard.activeIndex).toBe(1);
    });

    it('should go back to previous step', () => {
      wizard.next();
      wizard.previous();
      expect(wizard.activeIndex).toBe(0);
    });

    it('should not go below index 0', () => {
      wizard.previous();
      expect(wizard.activeIndex).toBe(0);
    });

    it('should not exceed last index', () => {
      wizard.next();
      wizard.next();
      wizard.next(); // Try to go past the end
      expect(wizard.activeIndex).toBe(2);
    });
  });

  describe('visibility logic', () => {
    beforeEach(async () => {
      ({ wizard, steps } = createWizard(3));
      await waitForUpdate(wizard);
      // Simulate firstUpdated being called
      wizard.firstUpdateCompleted = true;
    });

    it('shouldShowPrevious returns false on first step', () => {
      wizard.activeIndex = 0;
      expect(wizard.shouldShowPrevious()).toBe(false);
    });

    it('shouldShowPrevious returns true on second step', () => {
      wizard.next();
      expect(wizard.shouldShowPrevious()).toBe(true);
    });

    it('shouldShowNext returns true on first step', () => {
      expect(wizard.shouldShowNext()).toBe(true);
    });

    it('shouldShowNext returns false on last step', () => {
      wizard.next();
      wizard.next();
      expect(wizard.shouldShowNext()).toBe(false);
    });

    it('shouldShowSave returns false on first step', () => {
      expect(wizard.shouldShowSave()).toBe(false);
    });

    it('shouldShowSave returns true on last step', () => {
      wizard.next();
      wizard.next();
      expect(wizard.shouldShowSave()).toBe(true);
    });
  });

  describe('events', () => {
    beforeEach(async () => {
      ({ wizard, steps } = createWizard(2));
      await waitForUpdate(wizard);
    });

    it('should dispatch ogs-wizard-save-click event on save', async () => {
      const handler = vi.fn();
      wizard.addEventListener('ogs-wizard-save-click', handler);

      wizard.save();

      expect(handler).toHaveBeenCalledTimes(1);

      wizard.removeEventListener('ogs-wizard-save-click', handler);
    });

    it('save event should bubble and be composed', async () => {
      let receivedEvent: Event | null = null;
      const handler = (e: Event) => {
        receivedEvent = e;
      };
      document.body.addEventListener('ogs-wizard-save-click', handler);

      wizard.save();

      expect(receivedEvent).not.toBeNull();
      expect(receivedEvent!.bubbles).toBe(true);
      expect(receivedEvent!.composed).toBe(true);

      document.body.removeEventListener('ogs-wizard-save-click', handler);
    });
  });

  describe('item visibility', () => {
    beforeEach(async () => {
      ({ wizard, steps } = createWizard(3));
      await waitForUpdate(wizard);
    });

    it('should show only the active step', () => {
      wizard.updateItemVisibility();

      expect(steps[0].style.display).toBe('block');
      expect(steps[1].style.display).toBe('none');
      expect(steps[2].style.display).toBe('none');
    });

    it('should update visibility when navigating', () => {
      wizard.next();

      expect(steps[0].style.display).toBe('none');
      expect(steps[1].style.display).toBe('block');
      expect(steps[2].style.display).toBe('none');
    });
  });

  describe('single step wizard', () => {
    beforeEach(async () => {
      ({ wizard, steps } = createWizard(1));
      await waitForUpdate(wizard);
      wizard.firstUpdateCompleted = true;
    });

    it('should not show previous on single step', () => {
      expect(wizard.shouldShowPrevious()).toBe(false);
    });

    it('should not show next on single step', () => {
      expect(wizard.shouldShowNext()).toBe(false);
    });

    it('should show save on single step', () => {
      expect(wizard.shouldShowSave()).toBe(true);
    });
  });
});

describe('ogs-wizard-item', () => {
  it('should render with a slot', async () => {
    const item = document.createElement('ogs-wizard-item') as OgsWizardItem;
    item.heading = 'Test Step';
    document.body.appendChild(item);
    await item.updateComplete;

    expect(item.shadowRoot).not.toBeNull();
    expect(item.shadowRoot!.querySelector('slot')).not.toBeNull();

    item.remove();
  });

  it('should have configurable heading property', () => {
    const item = document.createElement('ogs-wizard-item') as OgsWizardItem;
    item.heading = 'Custom Heading';
    expect(item.heading).toBe('Custom Heading');
  });
});
