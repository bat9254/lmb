<script lang="ts">
  // Removed icon imports and m3-svelte imports

  import { text as textBoard } from "./assets/results.json";
  import { vision as visionBoard } from "./assets/results.json";
  import { default as imageArenaBoard } from "./assets/image_arena.json";
  import { default as imageArtificialBoard } from "./assets/image_artificial.json";
  import { default as imageFalBoard } from "./assets/image_fal.json";
  import ModelTable from "./ModelTable.svelte";
  import Dropdown from "./Dropdown.svelte"; // Assuming Dropdown is a custom component not from m3-svelte
  import {
    type FilterStrategy,
    type PriceRange,
    getFilterDescription,
    getPriceRangeLabel,
    modelMetadata // Ensure modelMetadata is imported if used directly here, though it seems used only within filterModels
  } from "./model-metadata";
  import { browser } from "$app/environment";

  let paradigm = "text",
    category = "full",
    styleControl = true;
  let searches: string[] = [];
  let settingsOpen = false; // State to control dialog visibility
  let showOpenOnly = false; // Renamed from openModelsOnly for clarity
  let vizBorder = false;
  let vizBar = false;
  let rankStrategy = "comparable";
  let filterStrategy: FilterStrategy = "hideDeprecated";
  let selectedPriceRanges = new Set<PriceRange>();
  let dialogRef: HTMLDialogElement; // Reference to the dialog element

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
      // Add style control variants if they exist in results.json
      "Overall Style Ctrl": "full_style_control",
      "IF Style Ctrl": "if_style_control",
      "Math Style Ctrl": "math_style_control",
      "Creative Style Ctrl": "creative_writing_style_control",
      "Coding Style Ctrl": "coding_style_control",
      "Multiturn Style Ctrl": "multiturn_style_control",
      "Hard 6 Style Ctrl": "hard_6_style_control",
      "Long User Style Ctrl": "long_user_style_control",
    },
    vision: { Overall: "full", English: "english", Chinese: "chinese" },
    image_arena: { Overall: "full" },
    image_artificial: { Overall: "full" },
    image_fal: { Overall: "full" },
  } as Record<string, Record<string, string>>;

  // Reactive derived state for the actual category key used in the board
  let currentCategoryKey = $derived(`${category}${styleControl ? "_style_control" : ""}`);

  // Find the human-readable name for the current category key
  function findCategoryName(key: string): string | undefined {
      for (const cat in categories[paradigm]) {
          if (categories[paradigm][cat] === key) {
              return cat;
          }
      }
      // Handle style control keys specifically if not directly in the map
      if (key.endsWith('_style_control')) {
           const baseKey = key.replace('_style_control', '');
            for (const cat in categories[paradigm]) {
                if (categories[paradigm][cat] === baseKey) {
                    return `${cat} Style Ctrl`; // Or however you want to display it
                }
            }
      }
      return undefined; // Fallback if not found
  }
  let currentCategoryName = $derived(findCategoryName(currentCategoryKey) || 'Overall'); // Default to 'Overall'


  const normalizeStep = () => {
    let board = getCurrentBoard();
    // Ensure the base category exists for the paradigm
    if (!Object.values(categories[paradigm]).includes(category)) {
      category = "full"; // Default to 'full' if invalid
    }

    // Check if the style control version exists; if not, disable style control
    const targetCategoryKey = `${category}_style_control`;
    if (styleControl && !(targetCategoryKey in board)) {
      styleControl = false;
    }
    // Update derived key after potential changes
    currentCategoryKey = `${category}${styleControl ? "_style_control" : ""}`;
  };
  $: category, paradigm, styleControl, normalizeStep();

  function getCurrentBoard() {
    switch (paradigm) {
      case "text":
        return textBoard;
      case "vision":
        return visionBoard;
      case "image_arena":
        return imageArenaBoard;
      case "image_artificial":
        return imageArtificialBoard;
      case "image_fal":
        return imageFalBoard;
      default:
        return textBoard; // Fallback
    }
  }

  // Persist settings to localStorage
  $effect(() => {
     if (browser) {
        try { // Use try/catch for potential JSON parsing errors or storage issues
            const storedVizBorder = localStorage.getItem("lmb-vizBorder");
            if (storedVizBorder) vizBorder = JSON.parse(storedVizBorder);

            const storedVizBar = localStorage.getItem("lmb-vizBar");
            if (storedVizBar) vizBar = JSON.parse(storedVizBar);

            const storedStyleControl = localStorage.getItem("lmb-styleControl");
            if (storedStyleControl) styleControl = JSON.parse(storedStyleControl);

            const storedShowOpen = localStorage.getItem("lmb-showOpenOnly");
            if (storedShowOpen) showOpenOnly = JSON.parse(storedShowOpen);

            const storedRank = localStorage.getItem("lmb-rankStrategy");
            if (storedRank) rankStrategy = storedRank;

            const storedFilter = localStorage.getItem("lmb-filterStrategy");
            if (storedFilter) filterStrategy = storedFilter as FilterStrategy;

            const storedPriceRanges = localStorage.getItem("lmb-selectedPriceRanges");
            if (storedPriceRanges) selectedPriceRanges = new Set(JSON.parse(storedPriceRanges));

        } catch (e) {
            console.error("Error reading settings from localStorage:", e);
            // Optionally reset to defaults here if reading fails
        }
      }
  });


  // Reactive statements to save settings when they change
  $effect(() => {if (browser) localStorage.setItem("lmb-vizBorder", JSON.stringify(vizBorder))});
  $effect(() => {if (browser) localStorage.setItem("lmb-vizBar", JSON.stringify(vizBar))});
  $effect(() => {if (browser) localStorage.setItem("lmb-styleControl", JSON.stringify(styleControl))});
  $effect(() => {if (browser) localStorage.setItem("lmb-showOpenOnly", JSON.stringify(showOpenOnly))});
  $effect(() => {if (browser) localStorage.setItem("lmb-rankStrategy", rankStrategy)});
  $effect(() => {if (browser) localStorage.setItem("lmb-filterStrategy", filterStrategy)});
  $effect(() => {if (browser) localStorage.setItem("lmb-selectedPriceRanges", JSON.stringify(Array.from(selectedPriceRanges)))});


  // Reactive logic to control the dialog's open state programmatically
  $effect(() => {
    // Ensure we are in the browser and the dialog element exists
    if (browser && dialogRef) {
      if (settingsOpen && !dialogRef.open) {
        // If state says open and dialog isn't, open it
        dialogRef.showModal();
      } else if (!settingsOpen && dialogRef.open) {
         // If state says closed and dialog is open, close it
        dialogRef.close();
      }
    }
  });

  // Function to handle Set changes reactively
  function togglePriceRange(range: PriceRange, isChecked: boolean) {
    const newSet = new Set(selectedPriceRanges); // Create a new Set based on the current one
    if (isChecked) {
        newSet.add(range);
    } else {
        newSet.delete(range);
    }
    // IMPORTANT: Assign the new Set back to the variable to trigger reactivity
    selectedPriceRanges = newSet;
  }
</script>

<svelte:head>
    <title>LMB - {currentCategoryName} ({paradigm})</title>
    <meta name="description" content="Leaderboard for {paradigm} models in the {currentCategoryName} category.">
 <!-- Define CSS Variables directly in head or link to app.css -->
 <!-- Note: app.css already defines these, so this might be redundant unless you need overrides -->
 <style>
    /* Removed the :root block as variables are in app.css */
 </style>
</svelte:head>

<div class="search-controls-container">
  <div class="controls-group">
    <Dropdown
      bind:value={paradigm}
      options={{
        Text: "text",
        Vision: "vision",
        "Img (Arena)": "image_arena", // Shorter labels for better fit
        "Img (AA)": "image_artificial",
        "Img (Fal)": "image_fal",
      }}
    />
    {#if Object.keys(categories[paradigm]).length > 1}
       <!-- Filter out style control variants from the dropdown options -->
       {@const displayOptions = Object.fromEntries(
           Object.entries(categories[paradigm]).filter(([_, val]) => !val.endsWith('_style_control'))
       )}
      <Dropdown bind:value={category} options={displayOptions} />
    {/if}
     {#if `${category}_style_control` in getCurrentBoard()}
      <!-- Custom toggle button for Style Control -->
      <label class="toggle-button">
        <input type="checkbox" bind:checked={styleControl} />
        <span>Style Ctrl</span>
      </label>
    {/if}
  </div>

  <div class="search-inputs">
    {#each searches as search, i}
      <div class="search-field">
        <span class="search-icon">🔍</span> <!-- Basic search icon -->
        <input type="text" bind:value={searches[i]} placeholder="Search model..." />
         {#if searches.length > 1}
           <button class="icon-button remove-search" on:click={() => searches = searches.filter((_, idx) => idx !== i)} title="Remove search">×</button>
         {/if}
      </div>
    {/each}
     {#if searches.length < 3} <!-- Limit number of search bars -->
        <button class="icon-button add-search" on:click={() => (searches = [...searches, ""])} title={searches.length ? 'Add another search' : 'Add search'}>
         {searches.length === 0 ? '🔍' : '+'}
        </button>
     {/if}
  </div>
  <button class="icon-button settings-button" on:click={() => (settingsOpen = true)} title="Settings">⚙️</button>
</div>

{#if currentCategoryKey in getCurrentBoard()}
  <ModelTable
    {paradigm}
    board={getCurrentBoard()}
    categoryKey={currentCategoryKey} <!-- Pass the actual key -->
    {searches}
    {showOpenOnly}
    {vizBorder}
    {vizBar}
    {rankStrategy}
    {filterStrategy}
    {selectedPriceRanges}
  />
{:else}
  <p>Category '{currentCategoryKey}' not found for paradigm '{paradigm}'. Please select a valid category.</p>
{/if}


<!-- Standard HTML Dialog -->
<dialog
  bind:this={dialogRef}
  class="settings-dialog"
  on:close={() => (settingsOpen = false)}
>
  <form method="dialog">
    <div class="settings-content">
      <h2>Settings</h2>

      <!-- Setting: Open Models Only -->
      <label class="setting-item toggle-like">
        <span>Open models only</span>
        <div class="switch">
             <input type="checkbox" bind:checked={showOpenOnly} id="showOpenOnlySwitch" />
             <label for="showOpenOnlySwitch" class="switch-track"></label>
        </div>
      </label>

      <!-- Setting: Visualize Scores -->
      <div class="filter-section-inline">
        <span>Visualize scores</span>
        <div class="button-group">
          <label class="toggle-button small">
            <input type="checkbox" bind:checked={vizBorder} />
            <span>Moats</span>
          </label>
          <label class="toggle-button small">
            <input type="checkbox" bind:checked={vizBar} />
            <span>Bars</span>
          </label>
        </div>
      </div>

      <!-- Setting: Rank Equivalence Threshold -->
      <div class="filter-section">
        <span>Rank equivalence threshold</span>
        <div class="button-group radio-group">
          <label class="radio-button">
            <input type="radio" name="rankStrategy" bind:group={rankStrategy} value="comparable" />
            <span>~50% vs next</span>
          </label>
          <label class="radio-button">
            <input type="radio" name="rankStrategy" bind:group={rankStrategy} value="league" />
            <span>~40% vs next</span>
          </label>
        </div>
      </div>

      <!-- Setting: Filter by Price Range -->
      {#if paradigm !== 'image_arena' && paradigm !== 'image_fal'} <!-- Conditionally show price filter -->
        <div class="filter-section">
            <span>Filter by price range</span>
            <div class="button-group">
            {#each ["$", "$$", "$$$", "$$$$"] as range (range)}
                {@const priceRange = range as PriceRange}
                {@const isSelected = selectedPriceRanges.has(priceRange)}
                <label class="toggle-button small">
                <input
                    type="checkbox"
                    checked={isSelected}
                    on:change={(e) => togglePriceRange(priceRange, (e.currentTarget as HTMLInputElement).checked)}
                />
                <span>{getPriceRangeLabel(priceRange)}</span>
                </label>
            {/each}
            </div>
        </div>
       {/if}

      <!-- Setting: Filter Similar Models -->
      <div class="filter-section">
        <span>Filter similar models</span>
        <div class="button-group radio-group">
          {#each ["showAll", "hideDeprecated", "hideOld", "onePerOrg"] as strategy (strategy)}
             {@const filterStrat = strategy as FilterStrategy}
            <label class="radio-button">
                <input
                    type="radio"
                    name="filterStrategy"
                    bind:group={filterStrategy}
                    value={filterStrat}
                    id="filter-{filterStrat}"
                />
                <span>{getFilterDescription(filterStrat)}</span>
            </label>
          {/each}
        </div>
      </div>
    </div> <!-- End .settings-content -->

    <div class="dialog-actions">
      <button type="submit" class="text-button">Done</button>
    </div>
  </form> <!-- End form -->
</dialog> <!-- End dialog -->


<style>
  /* General layout for search/controls */
  .search-controls-container {
    display: flex;
    flex-wrap: wrap; /* Allow wrapping on smaller screens */
    gap: 0.75rem;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: var(--color-surface-container); /* Use app.css var */
    border-radius: var(--border-radius-lg); /* Use app.css var */
    margin-bottom: 1rem; /* Space below controls */
    box-shadow: var(--shadow-sm); /* Use app.css var */
  }

  .controls-group {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .search-inputs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-grow: 1; /* Allow search area to take space */
    flex-wrap: wrap; /* Allow multiple search fields to wrap */
  }

  .search-field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background-color: var(--color-surface); /* Use app.css var */
    border: 1px solid var(--color-outline); /* Use app.css var */
    border-radius: var(--border-radius-full); /* Pill shape */
    flex-grow: 1; /* Allow individual search fields to grow */
    min-width: 160px; /* Prevent excessive shrinking */
    transition: border-color 0.2s ease;
  }
  .search-field:focus-within {
    border-color: var(--color-primary); /* Use app.css var */
    outline: 1px solid var(--color-primary); /* Focus indicator */
  }

  .search-icon {
    color: var(--color-text-variant); /* Use app.css var */
    flex-shrink: 0; /* Prevent icon shrinking */
  }

  .search-field input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text); /* Use app.css var */
    font-size: 0.9rem;
    width: 100%; /* Fill available space within the field */
  }
  .search-field input::placeholder {
    color: var(--color-text-variant); /* Use app.css var */
    opacity: 0.8;
  }
  .remove-search {
      padding: 0.2rem;
      width: 1.5rem;
      height: 1.5rem;
      line-height: 1;
      min-width: 0;
      font-size: 1rem;
      border-radius: 50%;
      border: none;
      background-color: var(--color-surface-variant);
      color: var(--color-text-variant);
      margin-left: 0.25rem;
  }
  .remove-search:hover {
      background-color: var(--color-outline);
      color: var(--color-surface);
  }


  /* General Button Styles */
  button, .button-like {
    padding: 0.6rem 1rem;
    border: 1px solid var(--color-outline); /* Use app.css var */
    border-radius: var(--border-radius-full); /* Use app.css var */
    background-color: var(--color-surface-container); /* Use app.css var */
    color: var(--color-primary); /* Use app.css var */
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
    text-align: center;
    line-height: 1.2; /* Adjust line height */
  }
  button:hover, .button-like:hover {
    background-color: var(--color-surface-variant); /* Use app.css var */
  }
  button:active, .button-like:active {
     background-color: var(--color-outline-variant); /* Use app.css var */
  }

  /* Icon Button Styles */
  .icon-button {
    padding: 0.6rem; /* Square padding */
    line-height: 1;
    min-width: 2.5rem; /* Ensure minimum size */
    height: 2.5rem; /* Match min-width for circle */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem; /* Adjust icon size */
    flex-shrink: 0; /* Prevent shrinking */
  }
  .settings-button {
    border-color: transparent;
    background-color: transparent;
    color: var(--color-text-variant); /* Use app.css var */
  }
   .settings-button:hover {
     background-color: var(--color-surface-container); /* Use app.css var */
     color: var(--color-primary); /* Use app.css var */
   }
   .add-search {
     border-style: dashed; /* Indicate adding action */
   }

  /* Text Button Style (like Dialog actions) */
  .text-button {
    background: none;
    border: none;
    color: var(--color-primary); /* Use app.css var */
    padding: 0.6rem 0.75rem; /* Less horizontal padding */
  }
  .text-button:hover {
    background-color: rgba(var(--color-primary-rgb, 0, 0, 0), 0.1); /* Assuming primary has RGB equivalent */
    opacity: 0.9; /* Keep opacity */
  }

  /* Custom Toggle/Radio Button Styling */
  .toggle-button,
  .radio-button {
    display: inline-flex;
    align-items: center;
    position: relative;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .toggle-button span,
  .radio-button span {
    display: block;
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-outline); /* Use app.css var */
    border-radius: var(--border-radius-full); /* Pill shape */
    background-color: var(--color-surface-container); /* Use app.css var */
    color: var(--color-text-variant); /* Use app.css var */
    transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    font-size: 0.875rem;
    white-space: nowrap; /* Prevent wrapping */
  }

  .toggle-button.small span,
  .radio-button.small span {
     padding: 0.3rem 0.8rem;
     font-size: 0.8rem;
  }

  .toggle-button input[type="checkbox"],
  .radio-button input[type="radio"] {
    appearance: none;
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  /* Checked State */
  .toggle-button input:checked + span,
  .radio-button input:checked + span {
    background-color: var(--color-secondary); /* Adjusted - Use secondary or primary as needed */
    color: var(--color-text-on-secondary); /* Adjusted */
    border-color: var(--color-secondary); /* Adjusted */
  }

  /* Grouping */
  .button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  /* Hover */
  .toggle-button:hover span,
  .radio-button:hover span {
      background-color: var(--color-surface-variant); /* Adjusted */
  }
  .toggle-button input:checked:hover + span,
  .radio-button input:checked:hover + span {
       background-color: var(--color-secondary); /* Keep checked color */
       opacity: 0.9;
  }

  /* Dialog Styling */
  .settings-dialog {
    border: none;
    border-radius: var(--border-radius-lg); /* Use app.css var */
    padding: 0;
    box-shadow: var(--shadow-md); /* Use app.css var */
    background-color: var(--color-surface); /* Use app.css var */
    color: var(--color-text); /* Use app.css var */
    max-width: 90vw;
    width: 500px;
    overflow: hidden;
  }

  .settings-dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
  }

  .settings-dialog form {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    padding: 1.5rem;
    flex-grow: 1;
    overflow-y: auto;
  }

  .settings-content h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--color-text); /* Use app.css var */
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .setting-item > span:first-child {
      color: var(--color-text); /* Use app.css var */
      font-size: 1rem;
  }

  .filter-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .filter-section > span:first-child,
  .filter-section-inline > span:first-child {
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--color-text-variant); /* Use app.css var */
    margin-bottom: 0.25rem;
  }

  .filter-section-inline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-outline); /* Use app.css var */
    background-color: var(--color-surface); /* Use app.css var */
    flex-shrink: 0;
  }

  /* Custom Switch Styles */
    .switch {
        position: relative;
        display: inline-block;
        width: 44px; /* Width of the track */
        height: 24px; /* Height of the track */
        flex-shrink: 0; /* Prevent shrinking in flex layouts */
    }

    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .switch-track {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--color-outline); /* Use app.css var */
        transition: background-color .2s ease;
        border-radius: var(--border-radius-full); /* Use app.css var */
    }

    /* Switch thumb */
    .switch-track:before {
        position: absolute;
        content: "";
        height: 18px; /* Size of the thumb */
        width: 18px;
        left: 3px; /* Initial position */
        bottom: 3px;
        background-color: white;
        transition: transform .2s ease;
        border-radius: 50%;
        box-shadow: var(--shadow-sm); /* Use app.css var */
    }

    /* Checked state */
    .switch input:checked + .switch-track {
        background-color: var(--color-primary); /* Use app.css var */
    }

    .switch input:checked + .switch-track:before {
        transform: translateX(20px); /* Move thumb across */
    }

    /* Focus state */
    .switch input:focus-visible + .switch-track {
       outline: 2px solid var(--color-primary); /* Use app.css var */
       outline-offset: 2px;
    }
</style>
