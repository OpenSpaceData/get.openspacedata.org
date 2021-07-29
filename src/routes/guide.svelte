<script>
  import {onMount} from 'svelte'
  import {choice as selected, location, range} from '$lib/store'
  import NumberedHeading from '$lib/NumberedHeading.svelte'

  console.log($selected)

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
  let guide

  onMount(async () => {
    // Get the content for the guide
    guide = await fetch('/guides.json')
      .then(resp => resp.json())
      .then(data => data.find(d => d.value === $selected.caseFolder))
    /*
	  Temporary use of json file.
	  Todo: Send request to API using
	  http://api.openspacedata.org/v1/{USE_CASE}/?from={startDate}&to={endDate}&location={location}&location=[ARRAY of bbox values from Mapbox]
	  Sample: https://openspacedata.pythonanywhere.com/v1/water/?format=json&from=2021-07-01&to=2021-07-15&location=[32.4371337890625%2C25.809781975840405%2C32.92877197265625%2C26.251546424213046]
	  */

    const api = await fetch('https://osd-fetch.fershad.workers.dev').then(resp => resp.json())
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
    <h1>Well done! And now there' s the fun part:</h1>
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
          First, you have to download the imagery directly from the European Space Agency. Sounds
          really exciting, right? But no problem for you: You just have to click the download
          buttons: 👇
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
      <div>
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
  </div>
</div>
