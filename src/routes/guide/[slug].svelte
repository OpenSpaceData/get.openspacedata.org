<script context="module">
  import {base} from '$app/paths'
  export async function load({page, fetch}) {
    const slug = page.params.slug
    const guide = await fetch(`${base}/guide/${slug}.json`).then(r => r.json())
    return {
      props: {guide},
    }
  }
</script>

<script>
  import {onMount} from 'svelte'
  import {choice as selected, location, range} from '$lib/store'
  import NumberedHeading from '$lib/NumberedHeading.svelte'
  import InlineSVG from 'svelte-inline-svg'
  import satellite from '$lib/svg/satellite.svg'

  export let guide
  console.log(guide)

  const rangeType = $range.type
  /*
    If the rangeType === 'latest' then set a startDate of 2 months ago & an endDate of today.
    If it is a 'range' then send through the range dates set by the user.
    */

  const getFilename = file => {
    const url = new URL(file).pathname.split('/')
    const filename = `${url[url.length - 2]}/${url[url.length - 1]}`
    return filename
  }

  let downloads = []
  let api = null

  function formatDate(date) {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear()

    if (month.length < 2) month = '0' + month
    if (day.length < 2) day = '0' + day

    return [year, month, day].join('-')
  }

  onMount(async () => {
    // Get the content for the guide

    // Could zip files in a function:
    // https://gist.github.com/noelvo/4502eea719f83270c8e9

    // Or on the browser:
    // https://huynvk.dev/blog/download-files-and-zip-them-in-your-browsers-using-javascript

    const apiCase = $selected.id
    const today = new Date()
    const twoMonthsAgo = new Date().setMonth(today.getMonth() - 2)

    const rangeStart = rangeType === 'latest' ? formatDate(twoMonthsAgo) : $range.startDate
    const rangeEnd = rangeType === 'latest' ? formatDate(today) : $range.endDate

    const apiUrl = `https://osd-fetch.fershad.workers.dev/?case=${apiCase}&from=${rangeStart}&to=${rangeEnd}&location=${$location.bbox}`
    api = await fetch(apiUrl).then(resp => resp.json())

    // console.log(api)
    const {files, bands} = api
    const filesRegex = /B.{2}/g

    const fileArray = Object.entries(files).map(e => e[1])

    downloads = await fileArray
      .map(file => {
        return Object.entries(file).filter(entry => {
          if (entry[0].match(filesRegex)) {
            return entry
          }
        })
      })
      .flat()
  })
</script>

<div class="guide">
  <div class="wrapper flow">
    {#if api && api.machine_name}
      {#if downloads.length > 0}
        <h1><strong>Well done! 🎉</strong><br />And now there' s the fun part:</h1>
        <section class="flow">
          <NumberedHeading text="What are we going to do?" step="?" />
          {#if guide}
            {@html guide.content.introduction[0]}
          {/if}
        </section>
        <section class="flow">
          <NumberedHeading
            text="Download your satellite imagery"
            step="1"
            details={$location ? `For ${$location.place_name}` : null} />
          <div class="content">
            <p>
              First, you have to download the imagery directly from the European Space Agency.
              Sounds really exciting, right? But no problem for you: You just have to click the
              download buttons: 👇
            </p>
            <ul class="downloads">
              {#each downloads as download}
                <li>
                  <a href={download[1]} download="" id="download-band-{download[0]}"
                    >Download file: {getFilename(download[1])}</a>
                </li>
              {:else}
                Loading ....
              {/each}
            </ul>
          </div>
          <div class="content">
            <h3>Why I have to download multiple files?</h3>
            <p>Good question! Here comes the answer. Lorem ipsum...</p>
          </div>
        </section>
        <section>
          <NumberedHeading step="2" text="Process the images" />
          {#if guide}
            {@html guide.content.process[0]}
          {/if}
        </section>
        <section>
          <NumberedHeading step="3" text="Interpret the data" />
          {#if guide}
            {@html guide.content.interpret[0]}
          {/if}
        </section>
      {:else}
        <h2>Data unavailable</h2>
        <p>We can't find data that matches you search criteria.</p>
        <a href="/" class="button">Modify criteria</a>
      {/if}
    {:else if api && api.failed}
      <h2>Data unavailable</h2>
      <p>We can't find data that matches you search criteria.</p>
      <a href="/" class="button">Modify criteria</a>
    {:else}
      <div class="loading">
        <InlineSVG src={satellite} />
        <h2>Fetching data ...</h2>
      </div>
    {/if}
  </div>
</div>

<style>
  .loading {
    height: 100%;
    width: 100%;
    display: grid;
    place-items: center;
    text-align: center;
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
