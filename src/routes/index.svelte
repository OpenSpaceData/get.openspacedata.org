<script>
  import {fly} from 'svelte/transition'
  import {choice as selected, location, range} from '$lib/store'
  import NumberedHeading from '$lib/NumberedHeading.svelte'
  import Caterogy from '$lib/Category.svelte'
  import LocationSearch from '$lib/LocationSearch.svelte'
  import TimeRange from '$lib/TimeRange.svelte'
  import Progress from '$lib/Progress.svelte'
  import {assign} from 'svelte/internal'

  let disableButton = true
  $: if ($selected && $location && $range.type === 'latest') {
    disableButton = false
  }
  $: if ($selected && $location && $range.type === 'range') {
    if (!$range.startDate || !$range.endDate) {
      disableButton = true
    } else {
      disableButton = false
    }
  }

  let progress = 1
  let showProgress = true

  $: $selected ? (progress = 2) : (progress = 1)
  $: $location ? (progress = 3) : (progress = 2)
</script>

{#if $selected && showProgress}
  <!-- content here -->
  <Progress bind:progress />
{/if}

{#if !$selected}
  <section out:fly={{x: -200, duration: 150}}>
    <div class="wrapper" data-height="full">
      <div class="flow">
        <NumberedHeading
          text="What do you want to do?"
          step="1"
          details="Select a category you want to investigate." />
      </div>
      <div class="full-width">
        <div class="wrapper">
          <Caterogy />
        </div>
      </div>
    </div>
  </section>
{/if}

{#if $selected && !$location}
  <section out:fly={{x: -200, duration: 150}} in:fly={{x: 200, delay: 300, duration: 150}}>
    <div class="wrapper flow" data-height="full">
      <NumberedHeading
        text="Where do you want to search?"
        step="2"
        details="Type a country, city, or region name into the search box, and select a location." />
      <LocationSearch />
    </div>
  </section>
{/if}

{#if $selected && $location}
  <section out:fly={{x: -200, duration: 150}} in:fly={{x: 200, delay: 300, duration: 150}}>
    <div class="wrapper flow" data-height="full">
      <NumberedHeading
        text="What time range do you want to investigate?"
        step="3"
        details="Get the latest satellite pictures, or search for a particular period." />
      <div class="flow">
        <TimeRange />
        <a
          class="submit"
          on:click={() => {
            showProgress = false
          }}
          href="/guide"
          class:disableButton
          >Alright! Get the data and start analyzing
          {#if !disableButton}
            <!-- content here -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              ><path
                fill="currentColor"
                d="M10.061 19.061L17.121 12 10.061 4.939 7.939 7.061 12.879 12 7.939 16.939z" /></svg>
          {/if}
        </a>
      </div>
    </div>
  </section>
{/if}

<style>
  .narrow {
    max-width: 45rem;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .wrapper[data-height='full'] {
    min-height: calc(100vh - 11rem);
    align-items: flex-start;
    grid-template-rows: auto 1fr;
  }

  section.flow {
    --flow-space: var(--size-600);
  }

  a.submit {
    border-radius: 12px;
    background: #1947e5;
    font-family: 'nowayregular', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #fff;
    padding: 20px 16px;
    width: 80%;
    font-size: 21px;
    margin: 2rem auto 2rem 0;
    box-shadow: #000 1px 2px 0;
    border: none;
    border-bottom: 2px solid #000;
    cursor: pointer;
    display: flex;
    gap: var(--size-500);
    justify-content: center;
    align-items: center;
    text-shadow: none;
  }

  :global(a.submit.disableButton) {
    background: var(--color-dark-grey) !important;
    color: var(--color-white) !important;
    cursor: default !important;
  }
</style>
