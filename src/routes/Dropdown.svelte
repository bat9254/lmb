<script lang="ts">
  // Use Svelte 5 runes
  let { value, options } = $props<{
    value: string;
    options: Record<string, string>;
  }>();
</script>

<select bind:value>
  {#each Object.entries(options) as [label, optionValue]}
    <option value={optionValue}>{label}</option>
  {/each}
</select>

<style>
  select {
    /* height: 100%; // Removed as it might conflict with flex alignment */
    padding: 0.5rem 2.5rem 0.5rem 0.75rem; /* Ensure space for arrow */
    background-color: var(--color-surface); /* Use app.css var */
    border: 1px solid var(--color-outline); /* Use app.css var */
    border-radius: var(--border-radius-full); /* Match button style */
    color: var(--color-text); /* Use app.css var */
    appearance: none; /* Reset default appearance */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E"); /* Default arrow */
    background-position: right 0.5rem center;
    background-repeat: no-repeat;
    background-size: 1.5em 1.5em;
    line-height: 1.2; /* Match button line height */
    font-size: 0.9rem; /* Match input font size */
    cursor: pointer;
    transition: border-color 0.2s ease;
  }
  select:hover {
    border-color: var(--color-primary); /* Use app.css var */
  }
  select:focus {
    outline: 1px solid var(--color-primary); /* Use app.css var */
    border-color: var(--color-primary);
  }

   /* Dark mode arrow */
  @media (prefers-color-scheme: dark) {
      select {
           background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E"); /* Lighter arrow for dark mode */
      }
  }
</style>
