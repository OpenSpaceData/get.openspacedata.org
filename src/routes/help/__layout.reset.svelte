<script>
  import Header from '$lib/Header.svelte'
  import Footer from '$lib/Footer.svelte'
  import '../../app.css'
</script>

<svelte:head>
  <title>OpenSpaceData | Help</title>
</svelte:head>

<Header />

<main class="flow wrapper">
  <slot />
</main>

<Footer />

<style>
  main.flow {
    --flow-space: var(--size-500);
  }
</style>
