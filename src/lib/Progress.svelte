<script>
	import { fly } from 'svelte/transition';
	export let progress = 1;
	import { choice as selected, location, range } from '$lib/store';

	const capitalize = str => {
		return str.charAt(0).toUpperCase() + str.slice(1);
	};
</script>

<aside in:fly={{ x: 200, delay: 500 }} out:fly={{ x: 200, duration: 100 }}>
	<p class="steps">Step {progress} of 3</p>
	{#if selected}
		<!-- content here -->
		<ol>
			{#if $selected}
				<li>Research: <span class="loud">{$selected.heading}</span></li>
			{/if}
			{#if $location}
				<li>Location: <span class="loud">{$location.place_name}</span></li>
			{/if}
		</ol>
	{/if}
</aside>

<style>
	aside {
		position: fixed;
		min-width: 10vw;
		max-width: 25vw;
		padding: calc(var(--size-900) + var(--size-400)) var(--size-400) var(--size-300) var(--size-400);
		width: 100%;
		border: 2px solid var(--color-black);
		bottom: var(--size-500);
		right: var(--size-400);
		background-color: var(--color-white);
		border-radius: 12px;
		z-index: 9999;
		overflow: hidden;
	}

	aside > .steps {
		position: absolute;
		padding: 0.3rem 0 0.1rem 0;
		margin-bottom: 0;
		top: 0;
		left: 0;
		right: 0;
		text-align: center;
		font-family: var(--heading-font);
		font-weight: 700;
		font-size: var(--size-600);
		background-color: var(--color-accent);
	}
</style>
