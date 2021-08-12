<script>
  import {choice as selected, location, range} from '$lib/store'
  export let section
  import edit from '$lib/svg/edit.svg'
  import InlineSVG from 'svelte-inline-svg'

  const goBack = step => {
    if (step === 1) {
      selected.set(null)
    }

    if (step === 2) {
      location.set(null)
    }

    if (step === 3) {
      range.set(null)
    }
  }
</script>

<div class="heading">
  {#if section === 'category'}
    <div id={$selected.parentFolder} class="step" />
  {/if}
  {#if section === 'location'}
    <div id="location" class="step">
      <!-- pin-s+555555($location.center) -->
      <img src="https://osd-static-map.fershad.workers.dev/?bbox={$location.bbox}" alt="" id="map" />
    </div>
  {/if}
  <div class="title">
    {#if section === 'category'}
      <h2>{$selected.heading}</h2>
      <button on:click={() => goBack(1)}>Edit</button>
    {/if}
    {#if section === 'location'}
      <!-- content here -->
      <h2>{$location.place_name}</h2>
      <button on:click={() => goBack(2)}>Edit</button>
    {/if}
    <!-- content here -->
  </div>
</div>

<style>
  button {
    display: inline;
    background: none;
    border: none;
    font-size: var(--size-300);
    color: var(--color-primary);
    text-decoration: underline;
    cursor: pointer;
    vertical-align: top;
    font-size: var(--size-500);
    font-family: var(--heading-font);
    padding: 0;
  }
  button:hover {
    color: var(--color-accent);
    text-decoration: none;
  }

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
    height: 100px;
    width: 100px;
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

  #map {
    height: 100px;
    width: 100px;
    border-radius: 100%;
  }

  #vegetation {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/forest.jpg');
    background-size: cover;
    background-position: center;
    height: 100px;
    width: 100px;
  }
  #floods {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/earth.jpg');
    background-size: cover;
    background-position: center;
    height: 100px;
    width: 100px;
  }
  #wildfire {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/wildfire.jpg');
    background-size: cover;
    background-position: center;
    height: 100px;
    width: 100px;
  }
  #water {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/wave.jpg');
    background-size: cover;
    background-position: center;
    height: 100px;
    width: 100px;
  }
  #urban {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/city.jpg');
    background-size: cover;
    background-position: center;
    height: 100px;
    width: 100px;
  }
  #snow {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/iceland.jpg');
    background-size: cover;
    background-position: center;
    height: 100px;
    width: 100px;
  }
  #time {
    background-image: url('/img/calendar.png');
    background-size: contain;
    background-position: center;
    height: 100px;
    width: 100px;
    background-repeat: no-repeat;
  }
</style>
