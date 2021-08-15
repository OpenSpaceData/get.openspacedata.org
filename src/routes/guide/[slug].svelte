<script context="module">
  import {base} from '$app/paths'
  export async function load({page, fetch}) {
    const slug = page.params.slug
    const location = page.query.get('location')
    const rangeStart = page.query.get('from')
    const rangeEnd = page.query.get('to')
    const apiUrl = `https://osd-fetch.fershad.workers.dev/?case=${slug}&from=${rangeStart}&to=${rangeEnd}&location=${location}`
    const api = await fetch(apiUrl).then(resp => resp.json())
    // let downloads = []

    const {files, bands} = api
    const filesRegex = /B.{2}/g

    const fileArray = Object.entries(files).map(e => e[1])

    const guide = await fetch(`${base}/guide/${slug}.json`).then(r => r.json())

    // const data = await Promise.all([guide, getFileSize(), downloads])
    // console.log(data)

    return {
      props: {guide, api, fileArray},
    }
  }
</script>

<script>
  export let guide
  export let api
  export let fileArray
  const filesRegex = /B.{2}/g
  // let downloads

  import {onMount} from 'svelte'
  import {choice as selected, location, range} from '$lib/store'
  import NumberedHeading from '$lib/NumberedHeading.svelte'
  import InlineSVG from 'svelte-inline-svg'
  import satellite from '$lib/svg/satellite.svg'

  const getFilename = file => {
    const url = new URL(file).pathname.split('/')
    const filename = `${url[url.length - 2]}/${url[url.length - 1]}`
    return filename
  }

  function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes == 0) return 'n/a'
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
    if (i == 0) return bytes + ' ' + sizes[i]
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i]
  }

  const findSize = (file, sizes) => {
    const match = sizes.find(size => size.file === file)
    const mb = bytesToSize(match.f)
    return mb
  }

  const downloads = (async () => {
    const array = fileArray.map(file => {
      return Object.entries(file).filter(entry => {
        if (entry[0].match(filesRegex)) {
          return entry
        }
      })
    })

    const allFiles = array.flat()
    return allFiles
  })()

  let getFileSizes

  onMount(async () => {
    //   // Get the content for the guide
    //   // Could zip files in a function:
    //   // https://gist.github.com/noelvo/4502eea719f83270c8e9
    //   // Or on the browser:
    //   // https://huynvk.dev/blog/download-files-and-zip-them-in-your-browsers-using-javascript

    getFileSizes = (async () => {
      const array = fileArray
        .map(file => {
          return Object.entries(file).filter(entry => {
            if (entry[0].match(filesRegex)) {
              return entry
            }
          })
        })
        .flat()

      const sizes = await array.map(async download => {
        const f = await fetch(`https://osd-file-size.fershad.workers.dev/?image=${download[1]}`)
          .then(data => data.json())
          .then(resp => resp.length)
        return {file: download[1], f}
      })

      const responses = await Promise.all(sizes)
      return responses
    })()
  })
</script>

<div class="guide">
  <div class="wrapper flow">
    {#if api && api.machine_name}
      {#await downloads then value}
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
            {#await getFileSizes then sizes}
              <ul class="downloads">
                {#each value as download}
                  <li>
                    <a href={download[1]} download="" id="download-band-{download[0]}"
                      >Download file: {getFilename(download[1])} ({findSize(
                        download[1],
                        sizes
                      )})</a>
                  </li>
                {:else}
                  Loading ....
                {/each}
              </ul>
            {/await}
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
      {/await}
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
