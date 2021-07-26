<script>
	import Header from '$lib/header/Header.svelte';
	import '../app.css';
</script>

<svelte:head>
	<title>OpenSpaceData</title>
</svelte:head>

<Header />

<main class="flow">
	<slot />
</main>

<style>
	main.flow {
		--flow-space: var(--size-900);
	}
</style>
