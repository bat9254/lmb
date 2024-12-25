<script lang="ts">
  import iconSearch from "@ktibow/iconset-material-symbols/search-rounded";
  import iconAdd from "@ktibow/iconset-material-symbols/add";
  import iconSettings from "@ktibow/iconset-material-symbols/settings-rounded";
  import {
    SegmentedButtonContainer,
    SegmentedButtonItem,
    Menu,
    MenuItem,
    Button,
    Icon,
    Dialog,
    Switch,
  } from "m3-svelte";
  import { text as textBoard, vision as visionBoard } from "./assets/results.json";
  import ModelTable from "./ModelTable.svelte";
  import { type FilterStrategy, getFilterDescription } from "./model-metadata";

  let category = "full",
    vision = false,
    styleControl = false;
  let searches: string[] = [];
  let settingsOpen = false;
  let showEloGaps = false;
  let showOpenOnly = false;
  let filterStrategy: FilterStrategy = "showAll";

  const categories = {
    text: {
      Overall: "full",
      "Hard prompts": "hard_6",
      "Hard prompts (english)": "hard_english_6",
      "Longer query": "long_user",
      Multiturn: "multiturn",
      English: "english",
      Math: "math",
      "Instruction following": "if",
      "Creative writing": "creative_writing",
      Coding: "coding",
      Chinese: "chinese",
      French: "french",
      German: "german",
      Japanese: "japanese",
      Korean: "korean",
      Russian: "russian",
      Spanish: "spanish",
      "Exclude <5 tok query": "no_short",
      "Exclude refusal": "no_refusal",
    },
    vision: { Overall: "full", English: "english", Chinese: "chinese" },
  };
  console.log(textBoard);

  const categoryName = (category: string, styleControl: boolean) =>
    `${category}${styleControl ? "_style_control" : ""}`;

  const normalizeStep = () => {
    const currentBoard = vision ? visionBoard : textBoard;

    if (!Object.values(categories[vision ? "vision" : "text"]).includes(category)) {
      category = "full";
    }

    const targetCategory = categoryName(category, styleControl);
    if (!(targetCategory in currentBoard)) {
      styleControl = false;
    }
  };
  $: category, vision, styleControl, normalizeStep();
</script>

<!--
coming soon:
- price data
- filter by price data
- graph price data
- view what each model's strengths are in a normalized view
- maybe better filtering (options for filter to open, and filter by price in one place)
-->
<div class="search">
  <select bind:value={category}>
    {#each Object.entries(categories[vision ? "vision" : "text"]) as [key, value]}
      <option {value}>{key}</option>
    {/each}
  </select>

  <SegmentedButtonContainer>
    {#if categoryName(category, styleControl) in visionBoard}
      <input type="checkbox" bind:checked={vision} id="vision" />
      <SegmentedButtonItem input="vision">Vision</SegmentedButtonItem>
    {/if}
    {#if categoryName(category, true) in (vision ? visionBoard : textBoard)}
      <input type="checkbox" bind:checked={styleControl} id="styleControl" />
      <SegmentedButtonItem input="styleControl">Style control</SegmentedButtonItem>
    {/if}
  </SegmentedButtonContainer>

  <div class="search-container">
    {#each searches as search, i}
      <div class="search-field">
        <Icon icon={iconSearch} />
        <input type="text" bind:value={searches[i]} placeholder="Search for a model" />
      </div>
    {/each}
    <Button type="text" iconType="full" on:click={() => (searches = [...searches, ""])}>
      <Icon icon={searches.length ? iconAdd : iconSearch} />
    </Button>
  </div>
  <Button type="text" iconType="full" on:click={() => (settingsOpen = true)}>
    <Icon icon={iconSettings} />
  </Button>
</div>
<ModelTable
  board={vision ? visionBoard : textBoard}
  {category}
  {styleControl}
  {searches}
  {showEloGaps}
  {showOpenOnly}
  {filterStrategy}
/>

<Dialog bind:open={settingsOpen} headline="Settings">
  <div class="settings-content">
    <label>
      Show moats
      <Switch bind:checked={showEloGaps} />
    </label>
    <label>
      Open models only
      <Switch bind:checked={showOpenOnly} />
    </label>

    <div class="filter-section">
      <span>Drop similar models</span>
      <SegmentedButtonContainer>
        {#each ["showAll", "hideDeprecated", "hideOld", "onePerOrg"] as FilterStrategy[] as strategy}
          <input
            type="radio"
            name="filterStrategy"
            bind:group={filterStrategy}
            value={strategy}
            id={strategy}
          />
          <SegmentedButtonItem input={strategy}>
            {getFilterDescription(strategy)}
          </SegmentedButtonItem>
        {/each}
      </SegmentedButtonContainer>
    </div>
  </div>
  <svelte:fragment slot="buttons">
    <Button type="text" on:click={() => (settingsOpen = false)}>Done</Button>
  </svelte:fragment>
</Dialog>

<style>
  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem 0;
  }

  .settings-content label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
  }

  .settings-content .filter-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.375rem;
  }

  .settings-content .filter-section span {
    color: rgb(var(--m3-scheme-on-surface-variant));
  }

  .search {
    display: flex;
    gap: 0.5rem;
    height: 2.5rem;
    align-self: center;
  }
  .search > * {
    background-color: rgb(var(--m3-scheme-surface-container));
    padding: 0 1rem;
    border-radius: 1.25rem;
  }

  .search-container {
    display: flex;
    gap: 0.5rem;
    padding: 0;
    align-items: center;
  }
  .search-field {
    display: flex;
    align-items: center;
    padding-left: 0.5rem;
    gap: 0.5rem;
    height: 100%;
    background: transparent;
  }
  .search-field :global(svg) {
    color: rgb(var(--m3-scheme-on-surface-variant));
  }
  .search-field input {
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: inherit;
  }

  .search > :global(.m3-container.text) {
    background-color: rgb(var(--m3-scheme-surface-container));
  }
</style>
