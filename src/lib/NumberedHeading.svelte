<script>
  export let step
  export let text
  export let details
</script>

<div class="heading">
  <div class="step"><span>{step}</span></div>
  <div class="title">
    <h2>{text}</h2>
    {#if details}
      <!-- content here -->
      <p>{details}</p>
    {/if}
  </div>
</div>

<style>
  .heading {
    display: grid;
    gap: var(--size-400);
    align-content: center;
    justify-content: center;
    grid-template-columns: 120px 1fr;
  }

  .step {
    display: inline-grid;
    background: var(--color-black);
    color: var(--color-white);
    height: 80px;
    width: 80px;
    text-align: center;
    place-items: center;
    font-family: var(--heading-font);
    font-size: var(--size-800);
    border-radius: 100%;
    aspect-ratio: 1;
    margin: auto;
  }

  /* .heading span {
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
	} */

  .heading .title {
    /* line-height: 1; */
    padding: var(--size-400) 0;
  }

  /* .heading span::before {
		content: '';
		background: var(--color-black);
		border-radius: 50%;
		height: calc(var(--size-900) * 1.8);
		width: calc(var(--size-900) * 1.8);
		position: absolute;
		z-index: -1;
		top: -0.4rem;
	} */

  .heading p {
    margin-bottom: 0;
  }

  h2 {
    margin: 0;
    font-size: var(--size-800);
  }
</style>
