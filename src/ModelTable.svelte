<script lang="ts">
  export let board: Record<string, Record<string, any>>;
  export let category: string;
  export let styleControl: boolean;
  export let searches: string[];
  export let filterMode: "all" | "hide-deprecated" | "hide-comparable";
  export let deprecatedModels: string[];
  export let comparableModels: string[];
  export let openModels: string[];

  $: categoryName = `${category}${styleControl ? "_style_control" : ""}`;

  let models: Array<{ name: string; rating: number; ciLow: number; ciHigh: number; rank: number }> =
    [];
  $: {
    const filteredModels = Object.entries(board[categoryName]?.elo_rating_final || {}).filter(
      ([name]) => {
        // Apply search filters (OR operation)
        if (searches.some((s) => s !== "")) {
          const matchesSearch = searches.some((search) => {
            if (search === "") return true;
            if (search.toLowerCase() === "open") return openModels.includes(name);
            return name.toLowerCase().includes(search.toLowerCase());
          });
          if (!matchesSearch) return false;
        }

        // Apply model filtering
        if (filterMode == "hide-deprecated" && deprecatedModels.includes(name)) {
          return false;
        }
        if (filterMode == "hide-comparable" && comparableModels.includes(name)) {
          return false;
        }

        return true;
      },
    );

    // Process models with confidence intervals
    const processedModels = filteredModels.map(([name, rating]) => {
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
        // Fallback to normal distribution approximation
        const variance = Number(board[categoryName]?.leaderboard_table_df?.variance?.[name]) || 0;
        const ci = Math.sqrt(variance) * 1.96;
        ciLow = Number(rating) - ci;
        ciHigh = Number(rating) + ci;
      }

      return {
        name,
        rating: Number(rating),
        ciLow,
        ciHigh,
        rank: 0, // Will be calculated below
      };
    });

    // Sort models and calculate ranks
    const sortedModels = processedModels.sort((a, b) => b.rating - a.rating);

    let rank = 1;
    let ciLow: number | undefined;
    models = sortedModels.map((model, index) => {
      if (!ciLow) {
        ciLow = model.ciLow;
      }
      if (model.ciHigh < ciLow) {
        ciLow = model.ciLow;
        rank = index + 1;
      }

      return { ...model, rank };
    });
  }

  function formatCI(rating: number, low: number, high: number): string {
    const minus = Math.round(rating - low);
    const plus = Math.round(high - rating);
    return `+${plus}/-${minus}`;
  }

  function getModelLink(name: string): string {
    // This is a placeholder - we'd need a mapping of model names to their URLs
    const providers = {
      gemini: "https://ai.google.dev/models/",
      gpt: "https://platform.openai.com/docs/models/",
      claude: "https://www.anthropic.com/claude",
      llama: "https://ai.meta.com/llama/",
      mistral: "https://mistral.ai/",
      qwen: "https://huggingface.co/Qwen/",
    };

    for (const [provider, url] of Object.entries(providers)) {
      if (name.toLowerCase().includes(provider)) {
        return url;
      }
    }
    return `https://huggingface.co/models?search=${encodeURIComponent(name)}`;
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
    {#each models as { name, rating, rank, ciLow, ciHigh }}
      <tr>
        <td>{rank}</td>
        <td>
          <a href={getModelLink(name)} target="_blank" rel="noopener noreferrer">
            {name}
            {#if openModels.includes(name)}
              <span class="badge">open</span>
            {/if}
          </a>
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
    border-collapse: collapse;
    margin-top: 1rem;
  }

  th,
  td {
    padding: 0.5rem;
    text-align: left;
    border-bottom: 1px solid rgb(var(--m3-scheme-outline-variant));
  }

  th {
    font-weight: bold;
    color: rgb(var(--m3-scheme-on-surface-variant));
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
