import { LitElement, type PropertyValues, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import cronstrue from 'cronstrue';
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';

type EditorMode = 'preset' | 'builder' | 'advanced';
type Frequency = 'minute' | 'every-n-hours' | 'hourly' | 'daily' | 'weekly' | 'monthly';

interface Preset {
  label: string;
  cron: string;
}

const PRESETS: Preset[] = [
  { label: 'Every minute', cron: '* * * * *' },
  { label: 'Every 5 minutes', cron: '*/5 * * * *' },
  { label: 'Every 15 minutes', cron: '*/15 * * * *' },
  { label: 'Every 30 minutes', cron: '*/30 * * * *' },
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every 6 hours', cron: '0 */6 * * *' },
  { label: 'Every 12 hours', cron: '0 */12 * * *' },
  { label: 'Daily at midnight', cron: '0 0 * * *' },
  { label: 'Daily at noon', cron: '0 12 * * *' },
  { label: 'Weekly on Monday', cron: '0 0 * * 1' },
  { label: 'Weekly on Friday at 3 AM', cron: '0 3 * * 5' },
  { label: 'Monthly on the 1st', cron: '0 0 1 * *' },
];

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

/**
 * Converts a cron expression to a human-readable string.
 * Returns null if the expression is invalid.
 */
export function describeCron(expression: string): string | null {
  try {
    return cronstrue.toString(expression, { use24HourTimeFormat: false });
  } catch {
    return null;
  }
}

/**
 * A cron expression generator that provides preset schedules, a frequency-based
 * builder, and a raw-expression editor with live human-readable feedback.
 *
 * @fires ogs-cron-change - Fired when the cron expression changes. Detail: `{ value: string, description: string | null }`
 */
@customElement('ogs-cron-generator')
export class OgsCronGenerator extends LitElement {
  /** The current cron expression, set by the parent. */
  @property({ type: String }) value = '0 * * * *';

  /** Internal working value that updates immediately on user interaction. */
  @state() private internalValue = '0 * * * *';

  @state() private mode: EditorMode = 'preset';
  @state() private advancedInput = '';
  @state() private advancedError = '';

  // Builder state
  @state() private frequency: Frequency = 'hourly';
  @state() private builderMinute = '0';
  @state() private builderHour = '0';
  @state() private builderDayOfWeek = '1';
  @state() private builderDayOfMonth = '1';
  @state() private builderMinuteInterval = '5';
  @state() private builderHourInterval = '6';

  static styles = css`
    :host {
      display: block;
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    /* --- Mode Tabs --- */

    .mode-tabs {
      display: flex;
      gap: 0.25rem;
      margin-bottom: 1rem;
    }

    .mode-tab {
      cursor: pointer;
      padding: 0.375rem 0.75rem;
      font-size: var(--wa-font-size-s);
      font-weight: 500;
      border-radius: var(--wa-border-radius-m);
      border: 1px solid var(--wa-color-surface-border);
      background: transparent;
      color: var(--wa-color-text-muted);
      transition: all 0.15s ease;
    }

    .mode-tab:hover {
      background: var(--wa-color-surface-alt);
      color: var(--wa-color-text-normal);
    }

    .mode-tab[aria-selected='true'] {
      background: var(--wa-color-brand-fill-normal);
      color: var(--wa-color-brand-on-normal);
      border-color: var(--wa-color-brand-fill-normal);
    }

    /* --- Description --- */

    .description-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding: 0.625rem 0.75rem;
      background: var(--wa-color-surface-alt);
      border-radius: var(--wa-border-radius-m);
      border: 1px solid var(--wa-color-surface-border);
    }

    .description-icon {
      color: var(--wa-color-brand-text);
      flex-shrink: 0;
    }

    .description-text {
      font-size: var(--wa-font-size-s);
      color: var(--wa-color-text-normal);
      font-weight: 500;
    }

    .description-cron {
      margin-left: auto;
      font-family: var(--wa-font-family-mono, monospace);
      font-size: var(--wa-font-size-xs);
      color: var(--wa-color-text-muted);
      flex-shrink: 0;
    }

    /* --- Presets Grid --- */

    .presets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.5rem;
    }

    .preset-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--wa-color-surface-border);
      border-radius: var(--wa-border-radius-m);
      background: transparent;
      cursor: pointer;
      text-align: left;
      font-size: var(--wa-font-size-s);
      color: var(--wa-color-text-normal);
      transition: all 0.15s ease;
    }

    .preset-btn:hover {
      background: var(--wa-color-surface-alt);
      border-color: var(--wa-color-brand-fill-normal);
    }

    .preset-btn[aria-selected='true'] {
      background: var(--wa-color-brand-fill-subtle);
      border-color: var(--wa-color-brand-fill-normal);
      color: var(--wa-color-brand-text);
      font-weight: 600;
    }

    .preset-btn wa-icon {
      flex-shrink: 0;
      font-size: 0.75rem;
    }

    /* --- Builder --- */

    .builder-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .builder-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .builder-label {
      font-size: var(--wa-font-size-s);
      font-weight: 500;
      color: var(--wa-color-text-muted);
      min-width: 40px;
    }

    /* --- Advanced --- */

    .advanced-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .advanced-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .advanced-help {
      font-size: var(--wa-font-size-xs);
      color: var(--wa-color-text-muted);
      line-height: 1.6;
    }

    .advanced-help code {
      font-family: var(--wa-font-family-mono, monospace);
      background: var(--wa-color-surface-alt);
      padding: 0.125rem 0.25rem;
      border-radius: var(--wa-border-radius-s);
      font-size: var(--wa-font-size-xs);
    }
  `;

  willUpdate(changed: PropertyValues): void {
    if (changed.has('value')) {
      this.internalValue = this.value;
    }
  }

  private get description(): string | null {
    return describeCron(this.internalValue);
  }

  private emitChange(newValue: string) {
    this.internalValue = newValue;
    const description = describeCron(newValue);
    this.dispatchEvent(
      new CustomEvent('ogs-cron-change', {
        detail: { value: newValue, description },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private selectPreset(preset: Preset) {
    this.emitChange(preset.cron);
  }

  private setMode(mode: EditorMode) {
    this.mode = mode;
    if (mode === 'advanced') {
      this.advancedInput = this.internalValue;
      this.advancedError = '';
    } else if (mode === 'builder') {
      this.parseIntoBuilder(this.internalValue);
    }
  }

  /** Best-effort parse of a cron expression into builder fields. */
  private parseIntoBuilder(expr: string) {
    const parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) return;

    const [minute, hour, dayOfMonth, , dayOfWeek] = parts;

    if (minute === '*' && hour === '*') {
      this.frequency = 'minute';
      this.builderMinuteInterval = '1';
    } else if (minute.startsWith('*/') && hour === '*') {
      this.frequency = 'minute';
      this.builderMinuteInterval = minute.slice(2);
    } else if (hour.startsWith('*/')) {
      // Step-hour patterns like "0 */6 * * *"
      this.frequency = 'every-n-hours';
      this.builderMinute = minute === '*' ? '0' : minute;
      this.builderHourInterval = hour.slice(2);
    } else if (hour === '*') {
      this.frequency = 'hourly';
      this.builderMinute = minute === '*' ? '0' : minute;
    } else if (dayOfMonth === '*' && dayOfWeek === '*') {
      this.frequency = 'daily';
      this.builderMinute = minute;
      this.builderHour = hour;
    } else if (dayOfWeek !== '*') {
      this.frequency = 'weekly';
      this.builderMinute = minute;
      this.builderHour = hour;
      this.builderDayOfWeek = dayOfWeek;
    } else if (dayOfMonth !== '*') {
      this.frequency = 'monthly';
      this.builderMinute = minute;
      this.builderHour = hour;
      this.builderDayOfMonth = dayOfMonth;
    }
  }

  private buildCronFromBuilder(): string {
    switch (this.frequency) {
      case 'minute':
        return this.builderMinuteInterval === '1' ? '* * * * *' : `*/${this.builderMinuteInterval} * * * *`;
      case 'every-n-hours':
        return `${this.builderMinute} */${this.builderHourInterval} * * *`;
      case 'hourly':
        return `${this.builderMinute} * * * *`;
      case 'daily':
        return `${this.builderMinute} ${this.builderHour} * * *`;
      case 'weekly':
        return `${this.builderMinute} ${this.builderHour} * * ${this.builderDayOfWeek}`;
      case 'monthly':
        return `${this.builderMinute} ${this.builderHour} ${this.builderDayOfMonth} * *`;
    }
  }

  private updateBuilder() {
    const cron = this.buildCronFromBuilder();
    this.emitChange(cron);
  }

  private onAdvancedInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.advancedInput = val;

    const desc = describeCron(val);
    if (desc) {
      this.advancedError = '';
      this.emitChange(val);
    } else {
      this.advancedError = 'Invalid cron expression';
    }
  }

  render() {
    return html`
      ${this.renderDescription()} ${this.renderModeTabs()} ${this.mode === 'preset' ? this.renderPresets() : nothing}
      ${this.mode === 'builder' ? this.renderBuilder() : nothing}
      ${this.mode === 'advanced' ? this.renderAdvanced() : nothing}
    `;
  }

  private renderDescription() {
    const desc = this.description;
    if (!desc) return nothing;

    return html`
      <div class="description-row">
        <wa-icon class="description-icon" name="clock"></wa-icon>
        <span class="description-text">${desc}</span>
        <span class="description-cron">${this.internalValue}</span>
      </div>
    `;
  }

  private renderModeTabs() {
    return html`
      <div class="mode-tabs" role="tablist">
        <button
          class="mode-tab"
          role="tab"
          aria-selected="${this.mode === 'preset'}"
          @click="${() => this.setMode('preset')}"
        >
          Presets
        </button>
        <button
          class="mode-tab"
          role="tab"
          aria-selected="${this.mode === 'builder'}"
          @click="${() => this.setMode('builder')}"
        >
          Builder
        </button>
        <button
          class="mode-tab"
          role="tab"
          aria-selected="${this.mode === 'advanced'}"
          @click="${() => this.setMode('advanced')}"
        >
          Advanced
        </button>
      </div>
    `;
  }

  private renderPresets() {
    return html`
      <div class="presets-grid" role="listbox" aria-label="Schedule presets">
        ${PRESETS.map(
          (preset) => html`
            <button
              class="preset-btn"
              role="option"
              aria-selected="${this.internalValue === preset.cron}"
              @click="${() => this.selectPreset(preset)}"
            >
              ${this.internalValue === preset.cron
                ? html`<wa-icon name="circle-check"></wa-icon>`
                : html`<wa-icon name="circle"></wa-icon>`}
              ${preset.label}
            </button>
          `,
        )}
      </div>
    `;
  }

  private renderBuilder() {
    return html`
      <div class="builder-section">
        <div class="builder-row">
          <span class="builder-label">Run</span>
          <wa-select
            value="${this.frequency}"
            size="small"
            @wa-change="${(e: Event) => {
              this.frequency = (e.target as HTMLSelectElement).value as Frequency;
              this.updateBuilder();
            }}"
          >
            <wa-option value="minute">Every N minutes</wa-option>
            <wa-option value="every-n-hours">Every N hours</wa-option>
            <wa-option value="hourly">Hourly</wa-option>
            <wa-option value="daily">Daily</wa-option>
            <wa-option value="weekly">Weekly</wa-option>
            <wa-option value="monthly">Monthly</wa-option>
          </wa-select>
        </div>

        ${this.frequency === 'minute' ? this.renderMinuteFields() : nothing}
        ${this.frequency === 'every-n-hours' ? this.renderEveryNHoursFields() : nothing}
        ${this.frequency === 'hourly' ? this.renderHourlyFields() : nothing}
        ${this.frequency === 'daily' ? this.renderTimeFields() : nothing}
        ${this.frequency === 'weekly' ? this.renderWeeklyFields() : nothing}
        ${this.frequency === 'monthly' ? this.renderMonthlyFields() : nothing}
      </div>
    `;
  }

  private renderMinuteFields() {
    return html`
      <div class="builder-row">
        <span class="builder-label">Every</span>
        <wa-select
          value="${this.builderMinuteInterval}"
          size="small"
          @wa-change="${(e: Event) => {
            this.builderMinuteInterval = (e.target as HTMLSelectElement).value;
            this.updateBuilder();
          }}"
        >
          <wa-option value="1">1 minute</wa-option>
          <wa-option value="2">2 minutes</wa-option>
          <wa-option value="5">5 minutes</wa-option>
          <wa-option value="10">10 minutes</wa-option>
          <wa-option value="15">15 minutes</wa-option>
          <wa-option value="20">20 minutes</wa-option>
          <wa-option value="30">30 minutes</wa-option>
        </wa-select>
      </div>
    `;
  }

  private renderEveryNHoursFields() {
    return html`
      <div class="builder-row">
        <span class="builder-label">Every</span>
        <wa-select
          value="${this.builderHourInterval}"
          size="small"
          @wa-change="${(e: Event) => {
            this.builderHourInterval = (e.target as HTMLSelectElement).value;
            this.updateBuilder();
          }}"
        >
          <wa-option value="2">2 hours</wa-option>
          <wa-option value="3">3 hours</wa-option>
          <wa-option value="4">4 hours</wa-option>
          <wa-option value="6">6 hours</wa-option>
          <wa-option value="8">8 hours</wa-option>
          <wa-option value="12">12 hours</wa-option>
        </wa-select>
      </div>
      <div class="builder-row">
        <span class="builder-label">At minute</span>
        <wa-select
          value="${this.builderMinute}"
          size="small"
          @wa-change="${(e: Event) => {
            this.builderMinute = (e.target as HTMLSelectElement).value;
            this.updateBuilder();
          }}"
        >
          ${Array.from(
            { length: 60 },
            (_, i) => html`<wa-option value="${i}">${String(i).padStart(2, '0')}</wa-option>`,
          )}
        </wa-select>
      </div>
    `;
  }

  private renderHourlyFields() {
    return html`
      <div class="builder-row">
        <span class="builder-label">At minute</span>
        <wa-select
          value="${this.builderMinute}"
          size="small"
          @wa-change="${(e: Event) => {
            this.builderMinute = (e.target as HTMLSelectElement).value;
            this.updateBuilder();
          }}"
        >
          ${Array.from(
            { length: 60 },
            (_, i) => html`<wa-option value="${i}">${String(i).padStart(2, '0')}</wa-option>`,
          )}
        </wa-select>
      </div>
    `;
  }

  private renderTimeFields() {
    return html`
      <div class="builder-row">
        <span class="builder-label">At</span>
        <wa-select
          value="${this.builderHour}"
          size="small"
          @wa-change="${(e: Event) => {
            this.builderHour = (e.target as HTMLSelectElement).value;
            this.updateBuilder();
          }}"
        >
          ${Array.from({ length: 24 }, (_, i) => {
            const label = i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`;
            return html`<wa-option value="${i}">${label}</wa-option>`;
          })}
        </wa-select>
        <span class="builder-label">:</span>
        <wa-select
          value="${this.builderMinute}"
          size="small"
          @wa-change="${(e: Event) => {
            this.builderMinute = (e.target as HTMLSelectElement).value;
            this.updateBuilder();
          }}"
        >
          ${Array.from(
            { length: 60 },
            (_, i) => html`<wa-option value="${i}">${String(i).padStart(2, '0')}</wa-option>`,
          )}
        </wa-select>
      </div>
    `;
  }

  private renderWeeklyFields() {
    return html`
      <div class="builder-row">
        <span class="builder-label">On</span>
        <wa-select
          value="${this.builderDayOfWeek}"
          size="small"
          @wa-change="${(e: Event) => {
            this.builderDayOfWeek = (e.target as HTMLSelectElement).value;
            this.updateBuilder();
          }}"
        >
          ${DAYS_OF_WEEK.map((d) => html`<wa-option value="${d.value}">${d.label}</wa-option>`)}
        </wa-select>
      </div>
      ${this.renderTimeFields()}
    `;
  }

  private renderMonthlyFields() {
    return html`
      <div class="builder-row">
        <span class="builder-label">On day</span>
        <wa-select
          value="${this.builderDayOfMonth}"
          size="small"
          @wa-change="${(e: Event) => {
            this.builderDayOfMonth = (e.target as HTMLSelectElement).value;
            this.updateBuilder();
          }}"
        >
          ${Array.from({ length: 31 }, (_, i) => html`<wa-option value="${i + 1}">${i + 1}</wa-option>`)}
        </wa-select>
      </div>
      ${this.renderTimeFields()}
    `;
  }

  private renderAdvanced() {
    return html`
      <div class="advanced-section">
        <div class="advanced-row">
          <wa-input
            value="${this.advancedInput}"
            placeholder="* * * * *"
            size="small"
            style="flex: 1;"
            @input="${this.onAdvancedInput}"
          >
            <span
              slot="prefix"
              style="font-family: var(--wa-font-family-mono, monospace); font-size: var(--wa-font-size-xs); color: var(--wa-color-text-muted);"
              >cron</span
            >
          </wa-input>
        </div>
        ${this.advancedError
          ? html`
              <wa-callout variant="danger" size="small">
                <wa-icon slot="icon" name="circle-exclamation"></wa-icon>
                ${this.advancedError}
              </wa-callout>
            `
          : nothing}
        <div class="advanced-help">
          Format: <code>minute</code> <code>hour</code> <code>day-of-month</code> <code>month</code>
          <code>day-of-week</code><br />
          Examples: <code>*/5 * * * *</code> (every 5 min), <code>0 9 * * 1-5</code> (weekdays at 9 AM),
          <code>0 0 1 * *</code> (monthly)
        </div>
      </div>
    `;
  }
}
