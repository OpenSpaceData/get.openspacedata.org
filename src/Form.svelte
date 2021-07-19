<script>
  import {fade} from 'svelte/transition'
  import {choice as selected, location, range} from './store'
  import Categories from './Categories.svelte'
  import BackToCategories from './components/BackToCategories.svelte'
  import Cases from './Cases.svelte'
  import LocationSearch from './components/LocationSearch.svelte'
  import TimeRange from './components/TimeRange.svelte'
  import Guide from './Guide.svelte'

  let choice = {category: true}
  let form = {display: true}

  export function parentToggle() {
    choice.category = !choice.category
  }

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
</script>

{#if form.display}
  <div class="start-form">
    <div class="use-cases">
      <div class="question-head">
        <div class="question-nr">1</div>
        <div class="question-title">What do you want to do?</div>
      </div>
      <div class="question-body">
        {#if choice.category}
          <div in:fade={{duration: 500, delay: 500}} out:fade={{duration: 250}}>
            <Categories toggle={parentToggle} />
          </div>
        {:else}
          <div in:fade={{duration: 400, delay: 150}} out:fade={{duration: 400}}>
            <BackToCategories toggle={parentToggle} />
            <Cases />
          </div>
        {/if}
      </div>
    </div>
    {#if $selected}
      <div class="use-cases" transition:fade>
        <div class="question-head">
          <div class="question-nr">2</div>
          <div class="question-title">Where do you want to {$selected.task}?</div>
        </div>
        <div class="question-body">
          <LocationSearch />
        </div>
      </div>
    {/if}
    {#if $selected && $location}
      <div class="use-cases" transition:fade>
        <div class="question-head">
          <div class="question-nr">3</div>
          <!-- content here -->
          <div class="question-title">What time range do you want to investigate?</div>
        </div>
        <div class="question-body">
          <div class="container">
            <div class="content">
              <TimeRange />
              <button
                class="submit"
                on:click={() => (form.display = !form.display)}
                disabled={disableButton}
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
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <Guide />
{/if}

<style>
  .container {
    max-width: 675px;
    margin: 0 auto;
    font-weight: bold;
  }

  .content {
    margin-left: 10%;
    width: 90%;
    height: auto;
    float: left;
  }

  .use-cases {
    max-width: 1280px;
    width: 100%;
    margin: 0 auto;
  }

  .start-form {
    display: flex;
    flex-direction: column;
  }

  .question-head {
    max-width: 675px;
    margin: 2rem auto 0;
    font-weight: bold;
    font-size: 2rem;
    /* padding: 2rem 0; */
    display: flex;
    gap: 1rem;
  }

  .question-title {
    font-family: 'nowaybold', -apple-system, BlinkMacSystemFont, sans-serif;
    width: 90%;
    height: auto;
    /* float: left; */
  }

  .question-nr {
    font-family: 'nowaybold', -apple-system, BlinkMacSystemFont, sans-serif;
    height: auto;
    width: 10%;
    /* float: left; */
    height: 44px;
    width: 44px;
    background-color: #000;
    border-radius: 50%;
    border: 3px #000 solid;
    color: #fff;
    display: grid;
    align-items: center;
    justify-content: center;
    place-items: center;
  }

  .question-nr span {
  }

  .question-nr span.no-fill {
    background-color: #fff;
    color: #000;
  }

  .question-body {
    width: 100%;
    display: block;
    clear: both;
    padding: 0.5rem 0;
  }

  button {
    border-radius: 12px;
    background: #1947e5;
    font-family: 'nowayregular', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #fff;
    padding: 20px 16px;
    width: 100%;
    font-size: 21px;
    margin: 2rem 0;
    box-shadow: #000 1px 2px 0;
    border: none;
    border-bottom: 2px solid #000;
    cursor: pointer;
  }

  :global(button[disabled]) {
    background: var(--color-dark-grey) !important;
    color: var(--color-white) !important;
    cursor: default !important;
  }

  .submit {
    display: flex;
    align-items: center;
    justify-content: space-around;
  }
</style>
