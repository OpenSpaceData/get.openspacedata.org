<script>
  import Header from '$lib/header/Header.svelte'
  import {SvelteToast} from '@zerodevx/svelte-toast'
  import '../app.css'
</script>

<svelte:head>
  <title>OpenSpaceData</title>
</svelte:head>

<Header />
<SvelteToast />
<main class="flow">
  <slot />
</main>

<style>
  main.flow {
    --flow-space: var(--size-900);
  }
</style>
