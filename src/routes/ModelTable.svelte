<script lang="ts">
  import { modelMetadata, type FilterStrategy, type PriceRange } from "./model-metadata";
  import { filterModels } from "./model-filtering";
  import ScatterChart from "./ScatterChart.svelte";
  import type { ModelData } from "./model-filtering"; // Assuming ModelData is the type returned by filterModels

  // Props using Svelte 5 $props rune
  let {
    paradigm,
    board,
    category,
    styleControl,
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
    category: string;
    styleControl: boolean;
    searches: string[];
    showOpenOnly?: boolean; // Mark as optional if default is provided
    vizBorder?: boolean;
    vizBar?: boolean;
    rankStrategy: string;
    filterStrategy: FilterStrategy;
    selectedPriceRanges: Set<PriceRange>;
  }>();

  // Derived state using Svelte 5 $derived rune
  let categoryName = $derived(`${category}${styleControl ? "_style_control" : ""}`);

  let models = $derived(filterModels(
    board,
    categoryName,
    searches,
    showOpenOnly,
    rankStrategy,
    filterStrategy,
    selectedPriceRanges,
  ));

  let anyCi = $derived(models.some((m: ModelData) => m.ciLow !== m.ciHigh));

  // Handle potential empty models array for Math.max
  let maxRating = $derived(models.length > 0 ? Math.max(...models.map((m: ModelData) => m.ciHigh)) : 1000); // Use 1000 as default or another sensible baseline

  // Regular functions remain unchanged
  function formatCI(rating: number, low: number, high: number): string {
    const minus = Math.round(rating - low);
    const plus = Math.round(high - rating);
    return `+${plus}/-${minus}`;
  }

  function getModelLink(name: string) {
    const metadata = modelMetadata[name];

    if (metadata?.isOpen) {
      return `https://huggingface.co/models?search=${encodeURIComponent(name)}`;
    }

    // Keep the orgToUrl mapping as is
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
      // Add other orgs if needed
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
          ? `${2 * Math.min(Math.max(models[i - 1].rating - rating, 0), 300) + 1}px`
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
            {@const ratingBase = 1000} {/* Define base for percentage calculation */}
            {@const ratingRange = maxRating - ratingBase}
            {@const pct1 = ratingRange > 0 ? Math.max((ciLow - ratingBase) / ratingRange, 0) * 100 : 0}
            {@const pct2 = ratingRange > 0 ? Math.max((rating - ratingBase) / ratingRange, 0) * 100 : 0}
            {@const pct3 = ratingRange > 0 ? Math.max((ciHigh - ratingBase) / ratingRange, 0) * 100 : 0}
            <div class="viz-bar">
              <div class="shadow" style:left="{pct1}%" style:right="{100 - pct3}%"></div>
              <div class="bar" style:width="{pct2}%"></div> {/* Simplified width */}
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

<ScatterChart {models} unit={paradigm.startsWith("image") ? "generation" : "1M tokens (mixed)"} />

<style>
  /* Styles from original, potentially updated based on your variables */
  :root {
    /* Define these CSS variables based on your theme */
    /* Example using placeholders */
    --m3-scheme-on-surface-variant: 100, 100, 100;
    --m3-scheme-outline-variant: 200, 200, 200;
    --m3-scheme-primary: 0, 123, 255;
    --m3-scheme-tertiary-container: 230, 240, 255;
    --m3-scheme-on-tertiary-container: 50, 70, 90;
    /* Diff variables */
    --border-radius-sm: 4px; /* Example value */
    --color-surface-container: rgb(240, 240, 240); /* Example value */
    --color-secondary: rgb(108, 117, 125); /* Example value */
    --color-text: rgb(33, 37, 41); /* Example value */
  }

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
    color: rgb(var(--m3-scheme-on-surface-variant));
  }

  td {
    border-top: var(--padding) solid rgb(var(--m3-scheme-outline-variant));
    transition: border-top-width 200ms;
  }

  td,
  th {
    font-variant-numeric: tabular-nums;
  }

  a {
    color: rgb(var(--m3-scheme-primary));
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  .badge {
    font-size: 0.75rem;
    padding: 0.1rem 0.4rem;
    border-radius: 1rem;
    background-color: rgb(var(--m3-scheme-tertiary-container));
    color: rgb(var(--m3-scheme-on-tertiary-container));
    margin-left: 0.5rem;
    vertical-align: middle;
  }

  /* Updated .viz-bar styles based on the diff */
  .viz-bar {
    display: flex;
    align-items: center;
    width: 60dvw;
    height: 1.5rem; /* Slightly smaller bar */
    position: relative;
    border-radius: var(--border-radius-sm);
    overflow: hidden; /* Hide overflow */
    background-color: var(--color-surface-container); /* Add background to bar container */

    .shadow {
      position: absolute;
      top: 0;
      bottom: 0;
      background-color: var(--color-secondary); /* Use secondary for CI shadow */
      opacity: 0.2;
      /* left/right set dynamically */
    }

    .bar {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0; /* Bar always starts from left */
      background-color: var(--color-secondary); /* Use secondary color */
      /* Removed border-radius from here, handled by parent overflow:hidden */
      /* width set dynamically */
    }

    span {
      color: var(--color-text); /* Use regular text color or a contrast color */
      padding-left: 0.5rem;
      z-index: 1;
      font-weight: 500;
      mix-blend-mode: difference; /* Make text visible on bar */
      pointer-events: none; /* Prevent text from interfering with potential interactions */
      line-height: 1.5rem; /* Match parent height */
    }
  }

  .short td {
      padding: 0.25rem 0.5rem;
  }
  /* Adjust .short .viz-bar height if needed, but it's already 1.5rem */
  /* .short .viz-bar { height: 1.2rem; } */ /* Example if further reduction desired */
  /* .short .viz-bar span { line-height: 1.2rem; } */ /* Match height */

</style>
