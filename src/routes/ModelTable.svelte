<script lang="ts">
  import { modelMetadata, type FilterStrategy, type PriceRange } from "./model-metadata";
  import { filterModels } from "./model-filtering";
  import ScatterChart from "./ScatterChart.svelte";
  import type { ModelData } from "./model-filtering"; // Assuming ModelData is the type returned by filterModels

  // Props using Svelte 5 $props rune
  let {
    paradigm,
    board,
    categoryKey, // Renamed from category for clarity
    searches,
    showOpenOnly = false, // Default values handled here
    vizBorder = false,
    vizBar = false,
    rankStrategy,
    filterStrategy,
    selectedPriceRanges,
  } = $props<{
    paradigm: string;
    board: Record<string, Record<string, any>>;
    categoryKey: string; // Use the actual key
    searches: string[];
    showOpenOnly?: boolean;
    vizBorder?: boolean;
    vizBar?: boolean;
    rankStrategy: string;
    filterStrategy: FilterStrategy;
    selectedPriceRanges: Set<PriceRange>;
  }>();


  let models = $derived(filterModels(
    board,
    categoryKey, // Use the direct key passed in
    searches,
    showOpenOnly,
    rankStrategy,
    filterStrategy,
    selectedPriceRanges,
  ));

  let anyCi = $derived(models.some((m: ModelData) => m.ciLow !== m.ciHigh));

  let maxRating = $derived(models.length > 0 ? Math.max(...models.map((m: ModelData) => m.ciHigh)) : 1000);

  function formatCI(rating: number, low: number, high: number): string {
    const minus = Math.round(rating - low);
    const plus = Math.round(high - rating);
    // Handle cases where CI might be zero or NaN
    const minusStr = isNaN(minus) ? '?' : minus;
    const plusStr = isNaN(plus) ? '?' : plus;
    return `+${plusStr}/-${minusStr}`;
  }

  function getModelLink(name: string) {
    const metadata = modelMetadata[name];

    if (metadata?.isOpen) {
      return `https://huggingface.co/models?search=${encodeURIComponent(name)}`;
    }

    const orgToUrl: Record<string, string> = {
      OpenAI: "https://platform.openai.com/docs/models/",
      Amazon: "https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html#model-ids-arns", // Updated Amazon link
      Anthropic: "https://www.anthropic.com/claude",
      Google: "https://ai.google.dev/models/",
      Deepseek: "https://www.deepseek.com/",
      Meta: "https://ai.meta.com/llama/",
      Mistral: "https://mistral.ai/",
      Qwen: "https://huggingface.co/Qwen/",
      xAI: "https://x.ai/",
      "01": "https://www.01.ai/",
      "Black Forest Labs": "https://blackforestlabs.ai/",
      "Reka AI": "https://www.reka.ai/ourmodels",
      Stability: "https://platform.stability.ai/",
    };

    if (metadata?.organization && metadata.organization in orgToUrl) {
      return orgToUrl[metadata.organization];
    }

    return undefined;
  }
</script>

<table>
  <thead>
    <tr>
      <th>Rank</th>
      <th>Model</th>
      <th>Rating</th>
      {#if anyCi}
        <th>95% CI</th>
      {/if}
    </tr>
  </thead>
  <tbody>
    {#each models as { name, rating, rank, ciLow, ciHigh }, i (name)}
      {@const link = getModelLink(name)}
      {#snippet text()}
        {name}
        {#if modelMetadata[name]?.isOpen}
          <span class="badge">open</span>
        {/if}
      {/snippet}
      <tr
        class:short={vizBorder}
        style:--padding={vizBorder && i > 0 && models[i - 1]
          ? `${Math.max(1, 2 * Math.min(Math.max(models[i - 1].ciLow - ciHigh, 0), 300))}px` // Adjusted calculation for clarity and ensure min 1px
          : "1px"}
      >
        <td>{rank}</td>
        <td>
          {#if link}
            <a href={link} target="_blank" rel="noopener noreferrer">
              {@render text()}
            </a>
          {:else}
            {@render text()}
          {/if}
        </td>
        <td>
          {#if vizBar}
            {@const ratingBase = 800} // Base for visualization
            {@const maxVizRating = Math.max(maxRating, ratingBase + 100)} // Ensure range > 0
            {@const ratingRange = maxVizRating - ratingBase}
            {@const pct1 = ratingRange > 0 ? Math.max((ciLow - ratingBase) / ratingRange, 0) * 100 : 0}
            {@const pct2 = ratingRange > 0 ? Math.max((rating - ratingBase) / ratingRange, 0) * 100 : 0}
            {@const pct3 = ratingRange > 0 ? Math.max((ciHigh - ratingBase) / ratingRange, 0) * 100 : 0}
            <div class="viz-bar">
              <div class="shadow" style:left="{pct1}%" style:right="{100 - pct3}%"></div>
              <div class="bar" style:width="{pct2}%"></div>
              <span>{Math.round(rating)}</span>
            </div>
          {:else}
            {Math.round(rating)}
          {/if}
        </td>
        {#if anyCi}
          <td>{formatCI(rating, ciLow, ciHigh)}</td>
        {/if}
      </tr>
    {/each}
  </tbody>
</table>

{#if models.some(m => modelMetadata[m.name]?.price !== undefined)}
  <ScatterChart {models} unit={paradigm.startsWith("image") ? "generation" : "1M tokens (mixed)"} />
{/if}


<style>
  /* Use app.css variables */
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-top: 1rem;
  }

  th,
  td {
    padding: 0.5rem;
    text-align: left;
  }

  th {
    font-weight: bold;
    color: var(--color-text-variant); /* Use app.css var */
  }

  td {
    border-top: var(--padding) solid var(--color-outline-variant); /* Use app.css var */
    transition: border-top-width 200ms;
  }

  /* Ensure last row doesn't have bottom border if using border-spacing: 0 */
  tbody tr:last-child td {
      border-bottom: none;
  }

  td,
  th {
    font-variant-numeric: tabular-nums;
  }

  a {
    color: var(--color-primary); /* Use app.css var */
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  .badge {
    font-size: 0.75rem;
    padding: 0.1rem 0.4rem;
    border-radius: var(--border-radius-full); /* Use app.css var */
    background-color: var(--color-tertiary); /* Use app.css var */
    color: var(--color-text-on-tertiary); /* Use app.css var */
    margin-left: 0.5rem;
    vertical-align: middle;
    font-weight: 500; /* Make badge text slightly bolder */
  }

  .viz-bar {
    display: flex;
    align-items: center;
    width: clamp(200px, 50vw, 400px); /* Responsive width */
    height: 1.5rem;
    position: relative;
    border-radius: var(--border-radius-sm); /* Use app.css var */
    overflow: hidden;
    background-color: var(--color-surface-container); /* Use app.css var */
    border: 1px solid var(--color-outline-variant); /* Subtle border */
  }

  .viz-bar .shadow {
    position: absolute;
    top: 0;
    bottom: 0;
    background-color: var(--color-secondary); /* Use app.css var */
    opacity: 0.2;
    /* left/right set dynamically */
  }

  .viz-bar .bar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    background-color: var(--color-secondary); /* Use app.css var */
    height: 100%;
    /* width set dynamically */
  }

  .viz-bar span {
    color: var(--color-text); /* Use app.css var */
    padding-left: 0.5rem;
    z-index: 1;
    font-weight: 500;
    mix-blend-mode: difference;
    filter: invert(1) grayscale(1) contrast(10); /* Improve contrast for text over bar */
    pointer-events: none;
    line-height: 1.5rem;
  }


  .short td {
      padding: 0.25rem 0.5rem;
  }
  .short .viz-bar {
      height: 1.2rem; /* Smaller height for short rows */
  }
   .short .viz-bar span {
       line-height: 1.2rem; /* Match parent height */
       font-size: 0.8rem; /* Smaller font for short rows */
   }

</style>
