/**
 * markdown-graph-renderer/src/renderer.js
 *
 * Core logic: extends marked.js with a custom code-block renderer that
 * intercepts special language tags and hands them off to Chart.js.
 *
 * Supported tags:
 *   ```chart:line    — line chart
 *   ```chart:bar     — bar chart
 *   ```chart:pie     — pie chart
 *   ```chart:scatter — scatter / bubble plot
 *   ```chart:box     — box plot  (via chartjs-chart-box)
 *   ```chart:hist    — histogram (auto-bins raw data)
 *
 * Each fenced block body is JSON describing the chart data and options.
 */

'use strict';

// ─── Unique ID counter ────────────────────────────────────────────────────────
let _chartCounter = 0;
function uid() { return `mgr-chart-${++_chartCounter}`; }

// ─── Histogram helper: bin raw values ─────────────────────────────────────────
function buildHistogramDataset(values, binCount = 10) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / binCount;

  const bins = Array.from({ length: binCount }, (_, i) => ({
    x: +(min + i * binWidth + binWidth / 2).toFixed(4),
    count: 0,
    label: `${+(min + i * binWidth).toFixed(2)}–${+(min + (i + 1) * binWidth).toFixed(2)}`,
  }));

  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / binWidth), binCount - 1);
    bins[idx].count++;
  }

  return {
    labels: bins.map(b => b.label),
    datasets: [{ label: 'Frequency', data: bins.map(b => b.count) }],
  };
}

// ─── Box-plot helper: compute 5-number summary ────────────────────────────────
function fiveNumber(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const q = (p) => {
    const pos = (sorted.length - 1) * p;
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  };
  return {
    min: sorted[0],
    q1: q(0.25),
    median: q(0.5),
    q3: q(0.75),
    max: sorted[sorted.length - 1],
  };
}

// ─── Main: parse a chart block and emit HTML ──────────────────────────────────
/**
 * @param {string} chartType  e.g. "line", "bar", "pie", "scatter", "box", "hist"
 * @param {string} rawBody    Raw JSON string from the fenced block
 * @returns {string}          HTML string (a <canvas> + inline <script>)
 */
function renderChartBlock(chartType, rawBody) {
  let spec;
  try {
    spec = JSON.parse(rawBody);
  } catch (e) {
    return `<pre class="mgr-error">Chart parse error: ${e.message}\n\n${rawBody}</pre>`;
  }

  const id = uid();
  let chartConfig;

  switch (chartType) {

    // ── Line ──────────────────────────────────────────────────────────────────
    case 'line': {
      chartConfig = {
        type: 'line',
        data: spec.data,
        options: {
          responsive: true,
          plugins: { title: { display: !!spec.title, text: spec.title } },
          scales: buildScales(spec),
          ...spec.options,
        },
      };
      break;
    }

    // ── Bar ───────────────────────────────────────────────────────────────────
    case 'bar': {
      chartConfig = {
        type: 'bar',
        data: spec.data,
        options: {
          responsive: true,
          plugins: { title: { display: !!spec.title, text: spec.title } },
          scales: buildScales(spec),
          ...spec.options,
        },
      };
      break;
    }

    // ── Pie / Doughnut ────────────────────────────────────────────────────────
    case 'pie':
    case 'doughnut': {
      chartConfig = {
        type: chartType,
        data: spec.data,
        options: {
          responsive: true,
          plugins: {
            title: { display: !!spec.title, text: spec.title },
            legend: { position: spec.legendPosition ?? 'right' },
          },
          ...spec.options,
        },
      };
      break;
    }

    // ── Scatter ───────────────────────────────────────────────────────────────
    case 'scatter': {
      chartConfig = {
        type: 'scatter',
        data: spec.data,
        options: {
          responsive: true,
          plugins: { title: { display: !!spec.title, text: spec.title } },
          scales: buildScales(spec),
          ...spec.options,
        },
      };
      break;
    }

    // ── Histogram (custom binning → bar chart) ────────────────────────────────
    case 'hist':
    case 'histogram': {
      // spec.values: number[]  or  spec.data.datasets[0].data: number[]
      const raw = spec.values ?? spec.data?.datasets?.[0]?.data ?? [];
      const binned = buildHistogramDataset(raw, spec.bins ?? 10);
      chartConfig = {
        type: 'bar',
        data: binned,
        options: {
          responsive: true,
          plugins: { title: { display: !!spec.title, text: spec.title }, legend: { display: false } },
          scales: {
            x: { title: { display: !!spec.xLabel, text: spec.xLabel } },
            y: { title: { display: true, text: spec.yLabel ?? 'Frequency' }, beginAtZero: true },
          },
          ...spec.options,
        },
      };
      break;
    }

    // ── Box plot (uses chartjs-chart-box plugin) ───────────────────────────────
    case 'box':
    case 'boxplot': {
      // spec.data.datasets[i].data: number[][]  — each inner array is one box
      // If raw arrays provided, compute summaries ourselves
      const datasets = (spec.data.datasets ?? []).map(ds => ({
        ...ds,
        data: ds.data.map(arr =>
          Array.isArray(arr) ? fiveNumber(arr) : arr
        ),
      }));
      chartConfig = {
        type: 'boxplot',
        data: { labels: spec.data.labels, datasets },
        options: {
          responsive: true,
          plugins: { title: { display: !!spec.title, text: spec.title } },
          scales: buildScales(spec),
          ...spec.options,
        },
      };
      break;
    }

    default:
      return `<pre class="mgr-error">Unknown chart type: "${chartType}"</pre>`;
  }

  const configJson = JSON.stringify(chartConfig);
  return `
<div class="mgr-chart-wrapper" style="max-width:${spec.width ?? '700px'};margin:1.5em auto">
  <canvas id="${id}"></canvas>
</div>
<script>
(function(){
  const ctx = document.getElementById('${id}').getContext('2d');
  new Chart(ctx, ${configJson});
})();
</script>`;
}

// ─── Scale builder helper ─────────────────────────────────────────────────────
function buildScales(spec) {
  return {
    x: { title: { display: !!spec.xLabel, text: spec.xLabel ?? '' } },
    y: { title: { display: !!spec.yLabel, text: spec.yLabel ?? '' }, beginAtZero: spec.beginAtZero ?? false },
  };
}

// ─── Hook into marked.js ──────────────────────────────────────────────────────
/**
 * Call this after loading marked.js in a browser or Node environment.
 *
 * Usage:
 *   import { setupMarked } from './renderer.js';
 *   setupMarked(marked);               // uses global marked
 *   const html = marked.parse(mdText);
 */
function setupMarked(markedInstance) {
  const renderer = new markedInstance.Renderer();
  const originalCode = renderer.code.bind(renderer);

  renderer.code = function (code, infoString, escaped) {
    // infoString is the language tag, e.g. "chart:line"
    const info = (infoString ?? '').trim();
    if (info.startsWith('chart:')) {
      const chartType = info.slice('chart:'.length).toLowerCase();
      return renderChartBlock(chartType, code);
    }
    // Fall through to default code rendering (syntax highlight, etc.)
    return originalCode(code, infoString, escaped);
  };

  markedInstance.setOptions({ renderer });
}

// ─── Exports ──────────────────────────────────────────────────────────────────
if (typeof module !== 'undefined') {
  module.exports = { setupMarked, renderChartBlock };
}
