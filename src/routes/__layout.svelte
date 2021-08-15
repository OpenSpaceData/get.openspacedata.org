<script>
  import Header from '$lib/Header.svelte'
  import Footer from '$lib/Footer.svelte'
  import {SvelteToast} from '@zerodevx/svelte-toast'
  import '../app.css'
</script>

<svelte:head>
  <title>OpenSpaceData</title>
  <link
    rel="preload"
    href="/font/noway-regular-webfont.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous" />
  <link
    rel="preload"
    href="/font/noway-bold-webfont.woff2"
    as="font"
    type="font/woff2"
    crossorigin="anonymous" />
</svelte:head>

<Header />
<SvelteToast options={{reversed: true, intro: {y: 192}}} />
<main class="flow">
  <slot />
</main>
<Footer />

<style>
  main.flow {
    --flow-space: var(--size-900);
  }
</style>
