<script lang="ts">
  export let value: string;
  export let options: Record<string, string>;
</script>

<select bind:value>
  {#each Object.entries(options) as [label, value]}
    <option {value}>{label}</option>
  {/each}
</select>

<style>
  select {
    height: 100%;
    padding-left: 1rem;
    background-color: transparent;
  }
</style>
