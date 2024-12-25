<script lang="ts">
  import {
    modelMetadata,
    type FilterStrategy,
    shouldShowModel,
    type ModelMetadata,
  } from "./model-metadata";

  export let board: Record<string, Record<string, any>>;
  export let category: string;
  export let styleControl: boolean;
  export let searches: string[];
  export let showEloGaps = false;
  export let showOpenOnly = false;
  export let filterStrategy: FilterStrategy = "showAll";

  $: categoryName = `${category}${styleControl ? "_style_control" : ""}`;

  let models: Array<{ name: string; rating: number; ciLow: number; ciHigh: number; rank: number }> =
    [];
  $: {
    models = [];
    for (const [name, rating] of Object.entries(board[categoryName]?.elo_rating_final || {})) {
      // Get bootstrap samples for this model
      const samples = board[categoryName]?.bootstrap_df?.[name] || {};
      const sampleValues = Object.values(samples) as number[];

      // Calculate confidence intervals from bootstrap if available
      let ciLow = 0,
        ciHigh = 0;
      if (sampleValues.length > 0) {
        const sorted = [...sampleValues].sort((a, b) => a - b);
        const lowIndex = Math.floor(sorted.length * 0.025); // 2.5 percentile
        const highIndex = Math.floor(sorted.length * 0.975); // 97.5 percentile
        ciLow = Number(sorted[lowIndex]) || Number(rating);
        ciHigh = Number(sorted[highIndex]) || Number(rating);
      } else {
        // // Fallback to normal distribution approximation
        // const variance = Number(board[categoryName]?.leaderboard_table_df?.variance?.[name]) || 0;
        // const ci = Math.sqrt(variance) * 1.96;
        // ciLow = Number(rating) - ci;
        // ciHigh = Number(rating) + ci;
      }

      models.push({
        name,
        rating: Number(rating),
        ciLow,
        ciHigh,
        rank: 0, // Will be calculated below
      });
    }

    models.sort((a, b) => b.rating - a.rating);

    let rank = 1;
    let ciLow: number | undefined;
    for (const [i, model] of Object.entries(models)) {
      if (!ciLow) {
        ciLow = model.ciLow;
      }
      if (model.ciHigh < ciLow) {
        ciLow = model.ciLow;
        rank = +i + 1;
      }

      model.rank = rank;
    }

    // Apply filters in stages
    if (searches.length > 0) {
      models = models.filter((model) => {
        const name = model.name.toLowerCase();
        return searches.some((search) => name.includes(search.toLowerCase()));
      });
    }

    // Apply open-only filter before strategy filter if enabled
    if (showOpenOnly) {
      models = models.filter((model) => {
        const metadata = modelMetadata[model.name];
        return metadata?.isOpen == true;
      });
    }

    // Apply strategy filter last
    if (filterStrategy != "showAll") {
      models = models.filter((model) => {
        const metadata = modelMetadata[model.name];
        return !metadata || shouldShowModel(model.name, metadata, filterStrategy, models);
      });
    }
  }

  function formatCI(rating: number, low: number, high: number): string {
    const minus = Math.round(rating - low);
    const plus = Math.round(high - rating);
    return `+${plus}/-${minus}`;
  }

  function getModelLink(name: string) {
    const metadata = modelMetadata[name];

    // Check if model is open source - default to HuggingFace
    if (metadata?.isOpen) {
      return `https://huggingface.co/models?search=${encodeURIComponent(name)}`;
    }

    // Map organizations to their documentation URLs
    const orgToUrl: Record<string, string> = {
      OpenAI: "https://platform.openai.com/docs/models/",
      Anthropic: "https://www.anthropic.com/claude",
      Google: "https://ai.google.dev/models/",
      Meta: "https://ai.meta.com/llama/",
      Mistral: "https://mistral.ai/",
      Qwen: "https://huggingface.co/Qwen/",
      xAI: "https://x.ai/",
      "01": "https://www.01.ai/",
    };

    // If we have organization metadata, use that first
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
      <th>95% CI</th>
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
        style:--padding={showEloGaps && i > 0
          ? `${2 * Math.min(Math.max(models[i - 1].rating - rating, 0), 300) + 1}px`
          : "1px"}
      >
        <td>{rank}</td>
        <td>
          {#if link}
            <a href={getModelLink(name)} target="_blank" rel="noopener noreferrer">
              {@render text()}
            </a>
          {:else}
            {@render text()}
          {/if}
        </td>
        <td>{Math.round(rating)}</td>
        <td>{formatCI(rating, ciLow, ciHigh)}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
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
</style>
