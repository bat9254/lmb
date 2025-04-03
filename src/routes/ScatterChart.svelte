<script lang="ts">
  import {
    Chart,
    ScatterController,
    LinearScale,
    LogarithmicScale,
    PointElement,
    LineElement,
    Legend,
    Tooltip,
  } from "chart.js";
  import { onMount } from "svelte";
  import type { ModelData } from "./model-filtering";
  import { modelMetadata } from "./model-metadata";

  Chart.register(
    ScatterController,
    LinearScale,
    LogarithmicScale,
    PointElement,
    LineElement,
    Legend,
    Tooltip,
  );

  let { models, unit }: { models: ModelData[]; unit: string } = $props();

  let chart: Chart | undefined;

  function updateChart() {
    const ctx = document.getElementById("scatter-chart") as HTMLCanvasElement;
    if (!ctx) return;

    if (chart) {
      chart.destroy();
    }

    // Helper to get RGB values from CSS variable
    function getRGBValues(cssVar: string): string {
      const style = getComputedStyle(document.documentElement);
      const colorValue = style.getPropertyValue(cssVar).trim();
      // Assuming colors are defined like #RRGGBB or rgb(r, g, b) - adapt if needed
      // This is a simplified parser, might need adjustments for hsl etc.
      if (colorValue.startsWith('rgb')) return colorValue.slice(4, -1);
      if (colorValue.startsWith('#')) { // Basic hex to rgb
          const bigint = parseInt(colorValue.slice(1), 16);
          return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
      }
      // Fallback or more parsing needed if using other formats like HSL
      return '0, 0, 0'; // Default fallback
    }

    const textColor = `rgb(${getRGBValues("--color-text")})`;
    const defaultPointColor = `rgb(${getRGBValues("--color-primary")})`; // Use primary color
    const defaultBorderColor = `rgb(${getRGBValues("--color-outline")})`;
    const openPointColor = `rgb(${getRGBValues("--color-tertiary")})`; // Use tertiary for open
    const openBorderColor = `rgb(${getRGBValues("--color-outline-variant")})`;

    const dataPoints = models
      .map((model) => {
        const metadata = modelMetadata[model.name];
        const isOpen = metadata?.isOpen;
        return {
          x: metadata?.price || 0,
          y: model.rating,
          label: model.name,
          backgroundColor: isOpen ? openPointColor : defaultPointColor,
          borderColor: isOpen ? openBorderColor : defaultBorderColor,
        };
      })
      .filter((point) => point.x > 0);

    chart = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            data: dataPoints,
            backgroundColor: dataPoints.map((d) => d.backgroundColor),
            borderColor: dataPoints.map((d) => d.borderColor),
            borderWidth: 1,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const point = dataPoints[context.dataIndex];
                const price = point.x < 0.01 ? point.x.toFixed(3) : point.x.toFixed(2);
                return `${point.label}: $${price}/${unit}, Score: ${point.y.toFixed(1)}`;
              },
            },
          },
        },
        scales: {
          x: {
            type: "logarithmic",
            position: "bottom",
            title: {
              display: true,
              text: `$ per ${unit}`,
              color: textColor,
            },
            ticks: {
              color: textColor,
            },
            grid: {
              color: `rgb(${getRGBValues("--color-outline-variant")})`, // Use new variable
            },
          },
          y: {
            type: "linear",
            title: {
              display: true, // Keep axis labels
              text: "Arena Score",
              color: textColor,
            },
            ticks: {
              color: textColor,
            },
            grid: {
              color: `rgb(${getRGBValues("--color-outline-variant")})`, // Use new variable
            },
          },
        },
      },
    });
  }

  $effect(() => {
    if (models && window) setTimeout(updateChart, 0);
  });
  $effect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", updateChart);

    return () => {
      mediaQuery.removeEventListener("change", updateChart);
      if (chart) {
        chart.destroy();
      }
    };
  });
</script>

<div class="chart-container">
  <canvas id="scatter-chart"></canvas>
</div>

<style>
  .chart-container {
    width: 100%;
    height: 400px;
    margin-top: 2rem;
    padding: 1rem;
    background-color: var(--color-surface-container);
    border-radius: var(--border-radius-lg); /* Use new variable */
    box-shadow: var(--shadow-sm); /* Use new variable */
  }
  :global(.chartjs-tooltip) {
    background: var(--color-surface) !important; /* Use new variable */
    color: var(--color-text) !important; /* Use new variable */
    border: 1px solid var(--color-outline) !important;
  }
</style>
