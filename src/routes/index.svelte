<script context="module">
  export const prerender = true
  export async function load({page, fetch, session, context}) {
    const categoriesURL = `/categories.json`
    const casesURL = `/cases.json`
    const guidesURL = `/guides.json`
    const categories = await fetch(categoriesURL)
    const cases = await fetch(casesURL)
    const guides = await fetch(guidesURL)

    if (categories.ok && cases.ok) {
      return {
        props: {
          categories: await categories.json(),
          cases: await cases.json(),
          guides: await guides.json(),
        },
      }
    }

    return {
      status: res.status,
      error: new Error(error),
    }
  }
</script>

<script>
  import {fly, slide, fade} from 'svelte/transition'
  import {choice as selected, location, range} from '$lib/store'
  import NumberedHeading from '$lib/NumberedHeading.svelte'
  import ProgressHeading from '$lib/ProgressHeading.svelte'
  import Caterogy from '$lib/Category.svelte'
  import LocationSearch from '$lib/LocationSearch.svelte'
  import TimeRange from '$lib/TimeRange.svelte'
  import Progress from '$lib/Progress.svelte'
  import {goto} from '$app/navigation'
  import {toast} from '@zerodevx/svelte-toast'
  import InlineSVG from 'svelte-inline-svg'
  import satellite from '$lib/svg/satellite.svg'

  export let categories
  export let cases

  function formatDate(date) {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear()

    if (month.length < 2) month = '0' + month
    if (day.length < 2) day = '0' + day

    return [year, month, day].join('-')
  }

  const today = new Date()
  const twoMonthsAgo = new Date().setMonth(today.getMonth() - 2)

  $: rangeStart = $range.type === 'latest' ? formatDate(twoMonthsAgo) : $range.startDate
  $: rangeEnd = $range.type === 'latest' ? formatDate(today) : $range.endDate

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
  let fetching = false

  $: $selected ? (progress = 2) : (progress = 1)
  $: $location ? (progress = 3) : (progress = 2)

  const checkForm = () => {
    if (!$selected) {
      toast.push('Please first select a category')
      return
    }
    if (!$location) {
      toast.push('Please choose a location')
      return
    }
    if ($range.type === 'range' && !$range.startDate && !$range.endDate) {
      toast.push('Please set a start and end date')
      return
    }
    if ($range.type === 'range' && !$range.startDate) {
      toast.push('Please set a start date')
      return
    }
    if ($range.type === 'range' && !$range.endDate) {
      toast.push('Please set an end date')
      return
    }
  }
</script>

<section>
  <div class="wrapper" data-height="">
    <div class="flow">
      {#if !$selected}
        <NumberedHeading
          text="What do you want to do?"
          step="1"
          details="Select a category you want to investigate." />
      {:else}
        <ProgressHeading section="category" />
      {/if}
    </div>
    {#if !$selected}
      <div class="full-width" transition:slide>
        <div class="wrapper" data-scroll>
          <Caterogy {categories} {cases} />
        </div>
      </div>
    {/if}
  </div>
</section>

<section>
  <div class="wrapper flow" data-height="">
    {#if !$location}
      <!-- content here -->
      <NumberedHeading
        text="Where do you want to search?"
        step="2"
        details="Type a country, city, or region name into the search box, and select a location." />
    {:else}
      <ProgressHeading section="location" />
    {/if}
    {#if $selected && !$location}
      <div transition:slide>
        <LocationSearch />
      </div>
    {/if}
  </div>
</section>

<section>
  <div class="wrapper flow" data-height="">
    <NumberedHeading
      text="What time range do you want to investigate?"
      step="3"
      details="Get the latest satellite pictures, or search for a particular period." />
    <div class="flow">
      {#if $selected && $location}
        <div transition:slide>
          <TimeRange />
        </div>
      {/if}
      {#if fetching}
        <!-- content here -->
        <div class="loading" out:fade|local={{duration: 50}} in:fade|local={{delay: 50}}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="icon icon-tabler icon-tabler-satellite"
            width="100"
            height="100"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="#000000"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path
              d="M3.707 6.293l2.586 -2.586a1 1 0 0 1 1.414 0l5.586 5.586a1 1 0 0 1 0 1.414l-2.586 2.586a1 1 0 0 1 -1.414 0l-5.586 -5.586a1 1 0 0 1 0 -1.414z" />
            <path d="M6 10l-3 3l3 3l3 -3" />
            <path d="M10 6l3 -3l3 3l-3 3" />
            <line x1="12" y1="12" x2="13.5" y2="13.5" />
            <path d="M14.5 17a2.5 2.5 0 0 0 2.5 -2.5" />
            <path d="M15 21a6 6 0 0 0 6 -6" />
          </svg>
          <h2>Fetching data ...</h2>
        </div>
      {:else}
        <!-- else content here -->
        <a
          out:fade|local={{duration: 50}}
          in:fade|local={{delay: 50}}
          class="button"
          on:click|preventDefault={() => {
            checkForm()
            if (!disableButton) {
              fetching = !fetching
              goto(
                `/guide/${$selected.id}?location=${$location.bbox}&from=${rangeStart}&to=${rangeEnd}`
              )
            }
          }}
          href="#"
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
      {/if}
    </div>
  </div>
</section>

<style>
  :global(:root) {
    --toastContainerTop: auto;
    --toastContainerRight: var(--size-400);
    --toastContainerBottom: calc(var(--size-900) * 2);
    --toastContainerLeft: auto;
    --toastBackground: var(--color-accent-light);
    --toastProgressBackground: var(--color-accent);
    --toastColor: var(--dark-text-color);
    --toastWidth: 100%;
  }

  .wrapper[data-scroll] {
    overflow-x: auto;
  }

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

  :global(a.button.disableButton) {
    background: var(--color-dark-grey) !important;
    color: var(--color-white) !important;
    cursor: default !important;
  }

  .loading {
    width: 100%;
    display: flex;
    gap: var(--size-600);
    justify-content: center;
    align-items: center;
  }

  :global(.loading svg) {
    animation: satellite-wobble 1s ease-in-out infinite alternate;
  }

  @keyframes satellite-wobble {
    33% {
      transform: rotate(5deg);
    }
    66% {
      transform: rotate(-5deg);
    }
  }
</style>
