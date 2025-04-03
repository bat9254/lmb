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
  } from "./model-metadata";
  import { browser } from "$app/environment";

  let paradigm = "text",
    category = "full",
    styleControl = true;
  let searches: string[] = [];
  let settingsOpen = false;
  let showOpenOnly = false; // Renamed from openModelsOnly for clarity
  let vizBorder = false;
  let vizBar = false;
  let rankStrategy = "comparable";
  let filterStrategy: FilterStrategy = "hideDeprecated";
  let selectedPriceRanges = new Set<PriceRange>();

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
    image_arena: { Overall: "full" },
    image_artificial: { Overall: "full" },
    image_fal: { Overall: "full" },
  } as Record<string, Record<string, string>>;

  const categoryName = (category: string, styleControl: boolean) =>
    `${category}${styleControl ? "_style_control" : ""}`;

  const normalizeStep = () => {
    if (!Object.values(categories[paradigm]).includes(category)) {
      category = "full";
    }

    const targetCategory = categoryName(category, styleControl);
    if (!(targetCategory in getCurrentBoard())) {
      styleControl = false;
    }
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
        return textBoard;
    }
  }

  // Persist settings to localStorage
  $: if (browser) {
    try { // Use try/catch for potential JSON parsing errors or storage issues
        const storedVizBorder = localStorage.getItem("lmb-vizBorder");
        if (storedVizBorder) vizBorder = JSON.parse(storedVizBorder);

        const storedVizBar = localStorage.getItem("lmb-vizBar");
        if (storedVizBar) vizBar = JSON.parse(storedVizBar);

        const storedStyleControl = localStorage.getItem("lmb-styleControl");
        if (storedStyleControl) styleControl = JSON.parse(storedStyleControl);

        // Add persistence for other settings if needed
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
    }
  }

  // Reactive statements to save settings when they change
  $: if (browser) localStorage.setItem("lmb-vizBorder", JSON.stringify(vizBorder));
  $: if (browser) localStorage.setItem("lmb-vizBar", JSON.stringify(vizBar));
  $: if (browser) localStorage.setItem("lmb-styleControl", JSON.stringify(styleControl));
  $: if (browser) localStorage.setItem("lmb-showOpenOnly", JSON.stringify(showOpenOnly));
  $: if (browser) localStorage.setItem("lmb-rankStrategy", rankStrategy);
  $: if (browser) localStorage.setItem("lmb-filterStrategy", filterStrategy);
  $: if (browser) localStorage.setItem("lmb-selectedPriceRanges", JSON.stringify(Array.from(selectedPriceRanges)));
  let dialogRef;
  let settingsOpen = false;

  $: {
    if (settingsOpen && dialogRef && !dialogRef.open) {
      dialogRef.showModal();
    } else if (!settingsOpen && dialogRef?.open) {
      dialogRef.close();
    }
  }
</script>

<!-- Use CSS Variables for theming (define these in a global stylesheet or :root) -->
<svelte:head>
 <style>
    :root {
        --color-primary: #6750a4; /* Example primary color */
        --color-on-primary: #ffffff;
        --color-primary-container: #eaddff;
        --color-on-primary-container: #21005e;
        --color-secondary: #625b71;
        --color-on-secondary: #ffffff;
        --color-secondary-container: #e8def8;
        --color-on-secondary-container: #1e192b;
        --color-tertiary: #7d5260;
        --color-on-tertiary: #ffffff;
        --color-tertiary-container: #ffd8e4;
        --color-on-tertiary-container: #370b1e;
        --color-error: #b3261e;
        --color-on-error: #ffffff;
        --color-error-container: #f9dedc;
        --color-on-error-container: #410e0b;
        --color-background: #fffbfe;
        --color-on-background: #1c1b1f;
        --color-surface: #fffbfe; /* Often same as background */
        --color-on-surface: #1c1b1f;
        --color-surface-variant: #e7e0ec;
        --color-on-surface-variant: #49454e;
        --color-outline: #79747e;
        --color-surface-container-high: #ece6f0;
        --color-surface-container: #f3edf7;
        --color-surface-container-low: #f7f2fa;
        --color-surface-bright: #fffbfe;
        --color-surface-dim: #ded8e1;

        --border-radius-sm: 4px;
        --border-radius-md: 8px;
        --border-radius-lg: 16px;
        --border-radius-xl: 28px;
        --border-radius-full: 999px;

        --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    }
    /* Add dark mode variables if needed */
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
      <Dropdown bind:value={category} options={categories[paradigm]} />
    {/if}
    {#if categoryName(category, true) in getCurrentBoard()}
      <!-- Custom toggle button -->
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
      </div>
    {/each}
    <button class="icon-button add-search" on:click={() => (searches = [...searches, ""])} title={searches.length ? 'Add another search' : 'Add search'}>
      {searches.length ? '+' : '🔍'}
    </button>
  </div>
  <button class="icon-button settings-button" on:click={() => (settingsOpen = true)} title="Settings">⚙️</button>
</div>

<ModelTable
  {paradigm}
  board={getCurrentBoard()}
  {category}
  {styleControl}
  {searches}
  {showOpenOnly}
  {vizBorder}
  {vizBar}
  {rankStrategy}
  {filterStrategy}
  {selectedPriceRanges}
/>

<!-- Standard HTML Dialog -->
<dialog
  bind:this={dialogRef}
  class="settings-dialog"
  on:close={() => (settingsOpen = false)}
>
  <form method="dialog">
    <div class="settings-content">
      <!-- Your dialog content here -->
    </div>
  </form>
</dialog>

  <form method="dialog"> <!-- Allows closing via buttons inside -->
    <div class="settings-content">
      <h2>Settings</h2>

      <label class="setting-item toggle-like">
        <span>Open models only</span>
        <div class="switch">
             <input type="checkbox" bind:checked={showOpenOnly} id="showOpenOnlySwitch" />
             <label for="showOpenOnlySwitch" class="switch-track"></label>
        </div>
      </label>
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

      <div class="filter-section">
        <span>Filter by price range</span>
        <div class="button-group">
          {#each ["$", "$$", "$$$", "$$$$"] as range (range)}
            {@const isSelected = selectedPriceRanges.has(range as PriceRange)}
            <label class="toggle-button small">
              <input
                type="checkbox"
                checked={isSelected}
                on:change={(e) => {
                  if (e.currentTarget.checked) {
                    selectedPriceRanges.add(range as PriceRange);
                  } else {
                    selectedPriceRanges.delete(range as PriceRange);
                  }
                  selectedPriceRanges = selectedPriceRanges; // Trigger reactivity
                }}
              />
              <span>{getPriceRangeLabel(range as PriceRange)}</span>
            </label>
          {/each}
        </div>
      </div>

      <div class="filter-section">
        <span>Filter similar models</span>
        <div class="button-group radio-group">
          {#each ["showAll", "hideDeprecated", "hideOld", "onePerOrg"] as strategy (strategy)}
            <label class="radio-button">
                <input
                    type="radio"
                    name="filterStrategy"
                    bind:group={filterStrategy}
                    value={strategy}
                    id="filter-{strategy}"
                />
                <span>{getFilterDescription(strategy as FilterStrategy)}</span>
            </label>
          {/each}
        </div>
      </div>
    </div>
    <div class="dialog-actions">
      <button type="submit" class="text-button">Done</button> <!-- Closes dialog due to form method="dialog" -->
    </div>
  </form>
</dialog>

<style>
  /* General layout for search/controls */
  .search-controls-container {
    display: flex;
    flex-wrap: wrap; /* Allow wrapping on smaller screens */
    gap: 0.75rem;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: var(--color-surface-container-low);
    border-radius: var(--border-radius-lg);
    margin-bottom: 1rem; /* Space below controls */
    box-shadow: var(--shadow-sm);
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
    background-color: var(--color-surface);
    border: 1px solid var(--color-outline);
    border-radius: var(--border-radius-full); /* Pill shape */
    flex-grow: 1; /* Allow individual search fields to grow */
    min-width: 160px; /* Prevent excessive shrinking */
    transition: border-color 0.2s ease;
  }
  .search-field:focus-within {
    border-color: var(--color-primary);
    outline: 1px solid var(--color-primary); /* Focus indicator */
  }

  .search-icon {
    color: var(--color-on-surface-variant);
    flex-shrink: 0; /* Prevent icon shrinking */
  }

  .search-field input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-on-surface);
    font-size: 0.9rem;
    width: 100%; /* Fill available space within the field */
  }
  .search-field input::placeholder {
    color: var(--color-on-surface-variant);
    opacity: 0.8;
  }

  /* General Button Styles */
  button, .button-like {
    padding: 0.6rem 1rem;
    border: 1px solid var(--color-outline);
    border-radius: var(--border-radius-full);
    background-color: var(--color-surface-container);
    color: var(--color-primary);
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
    text-align: center;
    line-height: 1.2; /* Adjust line height */
  }
  button:hover, .button-like:hover {
    background-color: var(--color-surface-container-high);
  }
  button:active, .button-like:active {
     background-color: var(--color-surface-variant);
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
    color: var(--color-on-surface-variant);
  }
   .settings-button:hover {
     background-color: var(--color-surface-container-high); /* Slight background on hover */
     color: var(--color-primary);
   }
   .add-search {
     border-style: dashed; /* Indicate adding action */
   }

  /* Text Button Style (like Dialog actions) */
  .text-button {
    background: none;
    border: none;
    color: var(--color-primary);
    padding: 0.6rem 0.75rem; /* Less horizontal padding */
  }
  .text-button:hover {
    background-color: var(--color-primary-container);
    opacity: 0.8;
  }

  /* Custom Toggle/Radio Button Styling (Segmented Button alternative) */
  .toggle-button,
  .radio-button {
    display: inline-flex; /* Use inline-flex for label behavior */
    align-items: center;
    position: relative; /* Needed for hiding the input */
    cursor: pointer;
    -webkit-tap-highlight-color: transparent; /* Remove tap highlight on mobile */
  }

  .toggle-button span,
  .radio-button span {
    display: block;
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-outline);
    border-radius: var(--border-radius-full); /* Pill shape */
    background-color: var(--color-surface-container);
    color: var(--color-on-surface-variant);
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
    appearance: none; /* Hide default appearance */
    position: absolute; /* Take out of layout */
    opacity: 0;
    width: 0;
    height: 0;
  }

  /* Checked State */
  .toggle-button input:checked + span,
  .radio-button input:checked + span {
    background-color: var(--color-secondary-container);
    color: var(--color-on-secondary-container);
    border-color: var(--color-secondary-container);
  }

  /* Grouping for Radio/Toggle buttons (replaces SegmentedButtonContainer) */
  .button-group {
    display: flex;
    flex-wrap: wrap; /* Allow buttons to wrap */
    gap: 0.5rem;
  }

  /* Ensure only one border between items in a group (more complex, requires :has or JS, optional) */
   /* Basic hover */
  .toggle-button:hover span,
  .radio-button:hover span {
      background-color: var(--color-surface-container-high);
  }
  .toggle-button input:checked:hover + span,
  .radio-button input:checked:hover + span {
       background-color: var(--color-secondary-container); /* Keep checked color on hover */
       opacity: 0.9;
  }

  /* Dialog Styling */
  .settings-dialog {
    border: none;
    border-radius: var(--border-radius-xl);
    padding: 0; /* Remove default padding */
    box-shadow: var(--shadow-lg);
    background-color: var(--color-surface);
    color: var(--color-on-surface);
    max-width: 90vw; /* Limit width */
    width: 500px; /* Default width */
  }

  .settings-dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px); /* Optional blur */
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 1.75rem; /* Spacing between sections */
    padding: 1.5rem; /* Inner padding */
  }

  .settings-content h2 {
    margin: 0 0 0.5rem 0; /* Reset margin */
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--color-on-surface);
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .setting-item > span:first-child { /* The label text */
      color: var(--color-on-surface);
      font-size: 1rem;
  }

  .filter-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .filter-section > span:first-child,
  .filter-section-inline > span:first-child {
    /* Style the title of the section */
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--color-on-surface-variant);
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
    padding: 0.5rem 1.5rem 1.5rem; /* Padding around actions */
    border-top: 1px solid var(--color-outline);
    margin-top: 1.5rem; /* Space above actions */
    background-color: var(--color-surface); /* Ensure background matches dialog */
    border-bottom-left-radius: var(--border-radius-xl); /* Match dialog radius */
    border-bottom-right-radius: var(--border-radius-xl);
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
        background-color: var(--color-outline);
        transition: background-color .2s ease;
        border-radius: var(--border-radius-full);
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
        box-shadow: var(--shadow-sm);
    }

    /* Checked state */
    .switch input:checked + .switch-track {
        background-color: var(--color-primary);
    }

    .switch input:checked + .switch-track:before {
        transform: translateX(20px); /* Move thumb across (width - thumb width - 2*padding) */
    }

    /* Focus state */
    .switch input:focus-visible + .switch-track {
       outline: 2px solid var(--color-primary);
       outline-offset: 2px;
    }

</style>
