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
  import { onMount, $effect } from "svelte"; // Correct import for $effect
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
  let chartCanvas: HTMLCanvasElement; // Use bind:this

  function updateChart() {
    // const ctx = document.getElementById("scatter-chart") as HTMLCanvasElement; // No longer needed
    if (!chartCanvas || !window) return; // Check if canvas is ready and in browser

    if (chart) {
      chart.destroy();
    }

    // Helper to get RGB string from CSS variable (simplified)
    function getColor(cssVar: string): string {
        // Directly return the var() expression. Chart.js might handle it,
        // or the browser resolves it before Chart.js uses it.
        // If Chart.js *needs* resolved values, you'll need getComputedStyle.
        // For simplicity first, let's try passing the var.
        // return `var(${cssVar})`;
        // Fallback: Use getComputedStyle for wider compatibility
         try {
            const style = getComputedStyle(document.documentElement);
            return style.getPropertyValue(cssVar).trim();
         } catch (e) {
             console.error(`Could not get style for ${cssVar}`, e);
             return '#000000'; // Default fallback color
         }
    }

    const textColor = getColor("--color-text");
    const defaultPointColor = getColor("--color-primary");
    const defaultBorderColor = getColor("--color-outline");
    const openPointColor = getColor("--color-tertiary");
    const openBorderColor = getColor("--color-outline-variant");
    const gridColor = getColor("--color-outline-variant");

    const dataPoints = models
      .map((model) => {
        const metadata = modelMetadata[model.name];
        const isOpen = metadata?.isOpen;
        const price = metadata?.price;
        // Filter out models without a price OR with price <= 0 for log scale
        if (price === undefined || price <= 0) {
            return null;
        }
        return {
          x: price,
          y: model.rating,
          label: model.name,
          backgroundColor: isOpen ? openPointColor : defaultPointColor,
          borderColor: isOpen ? openBorderColor : defaultBorderColor,
        };
      })
      .filter((point): point is NonNullable<typeof point> => point !== null); // Type guard to filter out nulls

     // Check if there's any data to plot after filtering
     if (dataPoints.length === 0) {
         console.log("No data with positive price to plot in scatter chart.");
         // Optionally display a message on the canvas or hide the chart
         const ctx = chartCanvas.getContext('2d');
         if (ctx) {
             ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
             ctx.fillStyle = textColor;
             ctx.textAlign = 'center';
             ctx.fillText('No price data available for selected models.', chartCanvas.width / 2, chartCanvas.height / 2);
         }
         return; // Don't create the chart if no data
     }


    chart = new Chart(chartCanvas, { // Use the bound canvas element
      type: "scatter",
      data: {
        datasets: [
          {
            data: dataPoints,
            // Chart.js can often take an array of colors directly
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
                // Ensure context.raw exists and has the expected structure
                 if (context.raw && typeof context.raw === 'object' && 'label' in context.raw && 'x' in context.raw && 'y' in context.raw) {
                    const point = context.raw as { label: string, x: number, y: number }; // Cast for type safety
                    const price = point.x < 0.01 ? point.x.toFixed(3) : point.x.toFixed(2);
                    return `${point.label}: $${price}/${unit}, Score: ${point.y.toFixed(1)}`;
                 }
                 return ''; // Fallback for unexpected context
              },
            },
             bodyFont: { // Ensure tooltip font matches body
                 family: "var(--font-body)"
             },
             titleFont: {
                 family: "var(--font-body)"
             }
          },
        },
        scales: {
          x: {
            type: "logarithmic", // Keep logarithmic for price
            position: "bottom",
            title: {
              display: true,
              text: `$ per ${unit} (Log Scale)`, // Indicate log scale
              color: textColor,
               font: { family: "var(--font-body)" }
            },
            ticks: {
              color: textColor,
              // Attempt to format ticks nicely for log scale
              callback: function(value, index, ticks) {
                  if (typeof value !== 'number') return value; // Handle non-numeric values if any
                  // Show labels for powers of 10, or specific meaningful values
                  const log10 = Math.log10(value);
                  if (Math.abs(log10 - Math.round(log10)) < 1e-9) { // Check if it's close to a power of 10
                     if (value < 1) return value.toPrecision(1); // e.g., 0.1, 0.01
                     return value.toString(); // e.g., 1, 10, 100
                  }
                  // Optionally add more specific ticks if needed, e.g., 0.5, 5, 50
                  // if (value === 0.5 || value === 5 || value === 50) return value.toString();
                  return undefined; // Hide other labels
              },
               font: { family: "var(--font-body)" }
            },
            grid: {
              color: gridColor,
            },
          },
          y: {
            type: "linear",
            title: {
              display: true, // Keep axis labels
              text: "Arena Score",
              color: textColor,
               font: { family: "var(--font-body)" }
            },
            ticks: {
              color: textColor,
               font: { family: "var(--font-body)" }
            },
            grid: {
              color: gridColor,
            },
          },
        },
      },
    });
  }

  // Use $effect for reactivity based on props
  $effect(() => {
      if (models && chartCanvas) { // Ensure canvas is available
          // Delay update slightly to allow DOM/CSS to settle
          const timer = setTimeout(updateChart, 50);
          return () => clearTimeout(timer); // Cleanup timeout on change
      }
  });

  // Effect for handling color scheme changes and cleanup
  $effect(() => {
    if (!window) return; // Guard for SSR

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const changeHandler = () => {
        if(chartCanvas) updateChart(); // Update only if canvas exists
    };

    mediaQuery.addEventListener("change", changeHandler);

    // Cleanup function
    return () => {
      mediaQuery.removeEventListener("change", changeHandler);
      if (chart) {
        chart.destroy();
        chart = undefined; // Clear reference
      }
    };
  });
</script>

<div class="chart-container">
  <canvas bind:this={chartCanvas} id="scatter-chart"></canvas> <!-- Use bind:this -->
</div>

<style>
  .chart-container {
    width: 100%;
    height: 400px;
    margin-top: 2rem;
    padding: 1rem;
    background-color: var(--color-surface-container); /* Use app.css var */
    border-radius: var(--border-radius-lg); /* Use app.css var */
    box-shadow: var(--shadow-sm); /* Use app.css var */
  }
  /* Tooltip styling using global selector as Chart.js appends it to body */
  :global(.chartjs-tooltip) {
    background: var(--color-surface) !important; /* Use app.css var */
    color: var(--color-text) !important; /* Use app.css var */
    border: 1px solid var(--color-outline) !important; /* Use app.css var */
    border-radius: var(--border-radius-sm);
    padding: 0.5rem;
    box-shadow: var(--shadow-md);
    font-family: var(--font-body); /* Ensure font matches */
    font-size: 0.85rem;
    opacity: 0.95 !important;
  }
  :global(.chartjs-tooltip-key) {
      display: none !important; /* Hide the default color box */
  }
</style>
