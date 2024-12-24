<script lang="ts">
  import {
    SegmentedButtonContainer,
    SegmentedButtonItem,
    Menu,
    MenuItem,
    Button,
    Icon,
  } from "m3-svelte";
  import { text as textBoard, vision as visionBoard } from "./assets/results.json";
  import ModelTable from "./ModelTable.svelte";
  import iconSearch from "@ktibow/iconset-material-symbols/search-rounded";
  import iconFilter from "@ktibow/iconset-material-symbols/filter-list";
  import iconAdd from "@ktibow/iconset-material-symbols/add";
  import iconCheck from "@ktibow/iconset-material-symbols/check";

  let category = "full",
    vision = false,
    styleControl = false;
  let filterMode: "all" | "hide-deprecated" | "hide-comparable" = "hide-deprecated";
  let searches: string[] = [""];
  let menuOpen = false;

  const deprecatedModels = [
    "chatgpt-4o-latest-20240808",
    "chatgpt-4o-latest-20240903",
    "gemini-1.5-flash-8b-exp-0827",
    "gemini-1.5-flash-exp-0827",
    "gemini-1.5-pro-api-0409-preview",
    "gemini-1.5-pro-exp-0801",
    "gemini-1.5-pro-exp-0827",
    "gemini-exp-1114",
    "gemini-exp-1121",
    "deepseek-v2.5",
    "deepseek-coder-v2",
    "reka-core-20240722",
  ];
  const comparableModels = [
    ...deprecatedModels,
    "bard-jan-24-gemini-pro",
    "chatglm-6b",
    "chatglm2-6b",
    "claude-3-5-sonnet-20240620",
    "claude-3-sonnet-20240229",
    "command-r",
    "command-r-plus",
    "deepseek-coder-v2",
    "deepseek-llm-67b-chat",
    "deepseek-v2-api-0628",
    "gemini-1.5-flash-001",
    "gemini-1.5-pro-001",
    "gemini-advanced-0514",
    "gemini-pro",
    "gemini-pro-dev-api",
    "gemma-1.1-2b-it",
    "gemma-1.1-7b-it",
    "gemma-2b-it",
    "gemma-7b-it",
    "gpt-3.5-turbo-0314",
    "gpt-3.5-turbo-0613",
    "gpt-4-0314",
    "gpt-4-1106-preview",
    "gpt-4o-2024-05-13",
    "gpt-4o-2024-08-06",
    "llama-13b",
    "llama-2-13b-chat",
    "llama-2-70b-chat",
    "llama-2-7b-chat",
    "llama-3-70b-instruct",
    "llama-3-8b-instruct",
    "llama-3.1-405b-instruct-fp8",
    "llama-3.1-70b-instruct",
    "mistral-7b-instruct",
    "mistral-large-2402",
    "mistral-large-2407",
    "openchat-3.5",
    "phi-3-mini-4k-instruct",
    "phi-3-vision-128k-instruct",
    "qwen-14b-chat",
    "qwen1.5-72b-chat",
    "qwen2-72b-instruct",
    "yi-34b-chat",
  ];
  const openModels = [
    "RWKV-4-Raven-14B",
    "athene-70b-0725",
    "athene-v2-chat",
    "c4ai-aya-expanse-32b",
    "c4ai-aya-expanse-8b",
    "chatglm-6b",
    "chatglm2-6b",
    "chatglm3-6b",
    "codellama-34b-instruct",
    "codellama-70b-instruct",
    "command-r",
    "command-r-08-2024",
    "command-r-plus",
    "command-r-plus-08-2024",
    "dbrx-instruct-preview",
    "deepseek-coder-v2",
    "deepseek-coder-v2-0724",
    "deepseek-llm-67b-chat",
    "deepseek-v2-api-0628",
    "deepseek-v2.5",
    "deepseek-v2.5-1210",
    "dolly-v2-12b",
    "falcon-180b-chat",
    "fastchat-t5-3b",
    "gemma-1.1-2b-it",
    "gemma-1.1-7b-it",
    "gemma-2-27b-it",
    "gemma-2-2b-it",
    "gemma-2-9b-it",
    "gemma-2-9b-it-simpo",
    "gemma-2b-it",
    "gemma-7b-it",
    "gpt4all-13b-snoozy",
    "guanaco-33b",
    "granite-3.0-2b-instruct",
    "granite-3.0-8b-instruct",
    "internlm2_5-20b-chat",
    "internvl2-26b",
    "internvl2-4b",
    "jamba-1.5-large",
    "jamba-1.5-mini",
    "koala-13b",
    "llama-13b",
    "llama-2-13b-chat",
    "llama-2-70b-chat",
    "llama-2-7b-chat",
    "llama-3-70b-instruct",
    "llama-3-8b-instruct",
    "llama-3.1-405b-instruct-bf16",
    "llama-3.1-405b-instruct-fp8",
    "llama-3.1-70b-instruct",
    "llama-3.1-8b-instruct",
    "llama-3.1-nemotron-51b-instruct",
    "llama-3.1-nemotron-70b-instruct",
    "llama-3.2-1b-instruct",
    "llama-3.2-3b-instruct",
    "llama-3.2-vision-11b-instruct",
    "llama-3.2-vision-90b-instruct",
    "llama-3.3-70b-instruct",
    "llava-v1.6-34b",
    "minicpm-v-2_6",
    "ministral-8b-2410",
    "mistral-7b-instruct",
    "mistral-7b-instruct-v0.2",
    "mistral-large-2407",
    "mistral-large-2411",
    "mixtral-8x22b-instruct-v0.1",
    "mixtral-8x7b-instruct-v0.1",
    "molmo-72b-0924",
    "molmo-7b-d-0924",
    "mpt-30b-chat",
    "mpt-7b-chat",
    "nemotron-4-340b-instruct",
    "nous-hermes-2-mixtral-8x7b-dpo",
    "oasst-pythia-12b",
    "olmo-7b-instruct",
    "openchat-3.5",
    "openchat-3.5-0106",
    "openhermes-2.5-mistral-7b",
    "phi-3-medium-4k-instruct",
    "phi-3-mini-128k-instruct",
    "phi-3-mini-4k-instruct",
    "phi-3-mini-4k-instruct-june-2024",
    "phi-3-small-8k-instruct",
    "phi-3-vision-128k-instruct",
    "phi-3.5-vision-instruct",
    "pixtral-12b-2409",
    "pixtral-large-2411",
    "qwen-14b-chat",
    "qwen1.5-110b-chat",
    "qwen1.5-14b-chat",
    "qwen1.5-32b-chat",
    "qwen1.5-4b-chat",
    "qwen1.5-72b-chat",
    "qwen1.5-7b-chat",
    "qwen2-72b-instruct",
    "qwen2-vl-72b",
    "qwen2-vl-7b-instruct",
    "qwen2.5-72b-instruct",
    "qwen2.5-coder-32b-instruct",
    "qwq-32b-preview",
    "stablelm-tuned-alpha-7b",
    "starling-lm-7b-alpha",
    "starling-lm-7b-beta",
    "stripedhyena-nous-7b",
    "snowflake-arctic-instruct",
    "vicuna-13b",
    "vicuna-33b",
    "vicuna-7b",
    "wizardlm-13b",
    "wizardlm-70b",
    "yi-1.5-34b-chat",
    "yi-34b-chat",
    "zephyr-7b-alpha",
    "zephyr-7b-beta",
    "zephyr-orpo-141b-A35b-v0.1",
  ];

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
- maybe better filtering (options for hide comparable, filter to open, and filter by price in one place)
-->
<div class="search">
  <select bind:value={category}>
    {#each Object.entries(categories[vision ? "vision" : "text"]) as [key, value]}
      <option {value}>{key}</option>
    {/each}
  </select>

  <div class="search-container">
    {#each searches as search, i}
      <div class="search-field">
        <Icon icon={iconSearch} />
        <input type="text" bind:value={searches[i]} placeholder={`Search for a model or "open"`} />
      </div>
    {/each}
    <Button type="text" iconType="full" on:click={() => (searches = [...searches, ""])}>
      <Icon icon={iconAdd} />
    </Button>
  </div>

  <button class="filter" on:click={() => (menuOpen = !menuOpen)}>
    <Icon width="1.5rem" height="1.5rem" icon={iconFilter} />
    {#if menuOpen}
      <Menu>
        <MenuItem
          on:click={() => (filterMode = "all")}
          icon={filterMode == "all" ? iconCheck : "space"}
        >
          Show all
        </MenuItem>
        <MenuItem
          on:click={() => (filterMode = "hide-deprecated")}
          icon={filterMode == "hide-deprecated" ? iconCheck : "space"}
        >
          Hide deprecated
        </MenuItem>
        <MenuItem
          on:click={() => (filterMode = "hide-comparable")}
          icon={filterMode == "hide-comparable" ? iconCheck : "space"}
        >
          Hide comparable
        </MenuItem>
      </Menu>
    {/if}
  </button>

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
</div>

<ModelTable
  board={vision ? visionBoard : textBoard}
  {category}
  {styleControl}
  {searches}
  {filterMode}
  {deprecatedModels}
  {comparableModels}
  {openModels}
/>

<style>
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
    align-items: center;
  }
  .search-field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: 100%;
    background: transparent;
  }
  .search-field input {
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: inherit;
  }
  .filter {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgb(var(--m3-scheme-primary));
    padding: 0 0.5rem;
  }
  .filter > :global(.m3-container) {
    position: absolute;
    top: 100%;
    right: 0;
  }
</style>
