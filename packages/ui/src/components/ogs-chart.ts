import { css, html, LitElement, PropertyValues } from 'lit';
import { customElement, property, query as queryEl } from 'lit/decorators.js';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
  type ChartType,
} from 'chart.js';

// Register only the components we need
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

@customElement('ogs-chart')
export class OgsChart extends LitElement {
  @property({ type: String }) type: ChartType = 'bar';
  @property({ type: Object }) data: ChartData | null = null;
  @property({ type: Object }) options: ChartOptions = {};

  @queryEl('canvas') private _canvas!: HTMLCanvasElement;

  private _chart: Chart | null = null;
  private _observer: MutationObserver | null = null;

  static styles = css`
    :host {
      display: block;
      position: relative;
      width: 100%;
      height: 100%;
    }

    .chart-container {
      position: relative;
      width: 100%;
      height: 100%;
    }
  `;

  render() {
    return html`
      <div class="chart-container">
        <canvas></canvas>
      </div>
    `;
  }

  override firstUpdated() {
    this._createChart();
    this._observeThemeChanges();
  }

  override updated(changedProps: PropertyValues) {
    if (changedProps.has('data') || changedProps.has('options') || changedProps.has('type')) {
      if (this._chart) {
        this._updateChart();
      }
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._chart?.destroy();
    this._chart = null;
    this._observer?.disconnect();
    this._observer = null;
  }

  private _createChart() {
    if (!this._canvas || !this.data) return;

    const colors = this._getThemeColors();

    this._chart = new Chart(this._canvas, {
      type: this.type,
      data: this.data,
      options: this._mergeOptions(colors),
    });
  }

  private _updateChart() {
    if (!this._chart || !this.data) return;

    const colors = this._getThemeColors();
    this._chart.data = this.data;
    this._chart.options = this._mergeOptions(colors);
    this._chart.update('none');
  }

  private _mergeOptions(colors: { text: string; grid: string; bg: string }): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: colors.text,
            font: { family: 'Inconsolata, monospace' },
          },
        },
        tooltip: {
          titleFont: { family: 'Inconsolata, monospace' },
          bodyFont: { family: 'Inconsolata, monospace' },
        },
      },
      scales: {
        x: {
          ticks: {
            color: colors.text,
            font: { family: 'Inconsolata, monospace', size: 11 },
          },
          grid: { color: colors.grid },
        },
        y: {
          ticks: {
            color: colors.text,
            font: { family: 'Inconsolata, monospace', size: 11 },
          },
          grid: { color: colors.grid },
        },
      },
      ...this.options,
    };
  }

  private _getThemeColors(): { text: string; grid: string; bg: string } {
    // Detect if dark mode by checking the document's color-scheme or class
    const isDark = this._isDarkMode();
    return {
      text: isDark ? '#c8cfd8' : '#3d4551',
      grid: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      bg: isDark ? '#1a1d23' : '#ffffff',
    };
  }

  private _isDarkMode(): boolean {
    // Check the html element's color-scheme attribute or class, as set by ogs-page
    const html = document.documentElement;
    const colorScheme = html.getAttribute('color-scheme') || html.style.colorScheme || '';
    if (colorScheme === 'dark') return true;
    if (colorScheme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private _observeThemeChanges() {
    // Watch for color-scheme attribute changes on <html> to refresh chart colors
    this._observer = new MutationObserver(() => {
      if (this._chart) {
        this._updateChart();
      }
    });
    this._observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['color-scheme', 'class', 'style'],
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ogs-chart': OgsChart;
  }
}
