<script>
  import {fly} from 'svelte/transition'
  export let progress = 1
  import {choice as selected, location, range} from '$lib/store'
  import edit from '$lib/svg/edit.svg'
  import InlineSVG from 'svelte-inline-svg'

  const capitalize = str => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

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

<aside in:fly={{x: 200, delay: 500}} out:fly={{x: 200, duration: 100}}>
  <p class="steps">Step {progress} of 3</p>
  {#if selected}
    <!-- content here -->
    <ol>
      {#if $selected}
        <li>
          <div id={$selected.parentFolder} />
          <div>
            <span class="loud">{$selected.heading}</span>
            <button on:click={() => goBack(1)}><InlineSVG src={edit} /></button>
          </div>
        </li>
      {/if}
      {#if $location}
        <li>
          <div id="location">
            <!-- pin-s+555555($location.center) -->
            <img src="https://osd-static-map.fershad.workers.dev/?bbox={$location.bbox}" alt="" />
          </div>
          <div>
            <span class="loud">{$location.place_name}</span>
            <button on:click={() => goBack(2)}><InlineSVG src={edit} /></button>
          </div>
        </li>
      {/if}
      {#if $range.type}
        <li>
          <div id="time" />
          <div>
            {#if $range.type === 'latest'}
              <span class="loud">Latest</span>
            {:else if $range.type === 'range'}
              {#if $range.endDate && $range.startDate}
                <span class="loud"
                  >{$range.startDate ? `${$range.startDate}  - ` : ''}{$range.endDate
                    ? $range.endDate
                    : ''}</span>
              {:else}
                <span class="loud">Set a date range</span>
              {/if}
            {:else}
              <span class="loud">Select an option</span>
            {/if}
            <button on:click={() => goBack(3)}><InlineSVG src={edit} /></button>
          </div>
        </li>
      {/if}
    </ol>
  {/if}
</aside>

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
  }
  button:hover {
    color: var(--color-accent);
  }
  aside {
    position: fixed;
    min-width: 10vw;
    max-width: 30vw;
    padding: calc(var(--size-900) + var(--size-400)) var(--size-400) var(--size-300) 0;
    width: 100%;
    border: 2px solid var(--color-black);
    bottom: var(--size-400);
    right: -2px;
    background-color: var(--color-white);
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

  aside > ol {
    padding: 0;
    margin-left: 0;
  }

  aside > ol > li {
    vertical-align: top;
    display: grid;
    grid-template-columns: var(--size-900) 1fr;
    grid-template-rows: minmax(var(--size-900), 1fr);
    gap: var(--size-300);
    align-items: center;
    margin-bottom: var(--size-300);
  }

  aside > ol > li:last-child {
    margin-bottom: 0;
  }

  svg {
    height: 100%;
    width: 100%;
  }

  #vegetation {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/forest.jpg');
    background-size: cover;
    background-position: center;
    height: 100%;
    width: 100%;
  }
  #floods {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/earth.jpg');
    background-size: cover;
    background-position: center;
    height: 100%;
    width: 100%;
  }
  #wildfire {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/wildfire.jpg');
    background-size: cover;
    background-position: center;
    height: 100%;
    width: 100%;
  }
  #water {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/wave.jpg');
    background-size: cover;
    background-position: center;
    height: 100%;
    width: 100%;
  }
  #urban {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/city.jpg');
    background-size: cover;
    background-position: center;
    height: 100%;
    width: 100%;
  }
  #snow {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/iceland.jpg');
    background-size: cover;
    background-position: center;
    height: 100%;
    width: 100%;
  }
  #time {
    background-image: url('/img/calendar.png');
    background-size: contain;
    background-position: center;
    height: 100%;
    width: 100%;
    background-repeat: no-repeat;
  }
</style>
