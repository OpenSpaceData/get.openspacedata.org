<script>
	export let step;
	export let text;
	export let details;
</script>

<div class="heading">
	<span>{step}</span>
	<div>
		<h2 class="title">{text}</h2>
		{#if details}
			<!-- content here -->
			<p>{details}</p>
		{/if}
	</div>
</div>

<style>
	.heading {
		display: flex;
		gap: var(--size-400);
		align-items: center;
	}

	.heading span {
		font-family: var(--heading-font);
		font-size: var(--size-800);
		color: var(--color-white);
		border-radius: 100%;
		height: calc(var(--size-900) * 0.8);
		width: calc(var(--size-900) * 0.8);
		display: grid;
		align-items: center;
		justify-content: center;
		place-items: center;
		position: relative;
		z-index: 0;
		margin: 0 2rem 0 0;
	}

	.heading .title {
		font-family: var(--heading-font);
		font-size: var(--size-800);
		line-height: 1;
	}

	.heading span::before {
		content: '';
		background: var(--color-black);
		border-radius: 50%;
		height: calc(var(--size-900) * 1.8);
		width: calc(var(--size-900) * 1.8);
		position: absolute;
		z-index: -1;
		top: -0.4rem;
	}

	.heading p {
		margin-bottom: 0;
	}
</style>
