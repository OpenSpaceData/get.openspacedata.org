<script context="module">
  import {base} from '$app/paths'
  export async function load({page, fetch}) {
    const slug = page.params.slug
    const location = page.query.get('location')
    const rangeStart = page.query.get('from')
    const rangeEnd = page.query.get('to')
    const apiUrl = `https://osd-fetch.fershad.workers.dev/?case=${slug}&from=${rangeStart}&to=${rangeEnd}&location=${location}`
    try {
      const api = await fetch(apiUrl).then(resp => resp.json())
      // let downloads = []
      const {files, bands} = api
      const filesRegex = /B.{2}/g

      const fileArray = Object.entries(files).map(e => e[1])

      const guide = await fetch(`${base}/guide/${slug}.json`).then(r => r.json())

      return {
        props: {status: 200, guide, api, fileArray},
      }
    } catch (error) {
      return {
        status: 206,
        // error: new Error(`Could not load`),
        // redirect: '/',
      }
    }
  }
</script>

<script>
  export let guide
  export let api
  export let fileArray
  export let status

  const filesRegex = /B.{2}/g
  // let downloads

  import {toast} from '@zerodevx/svelte-toast'
  import {htmlEscape, htmlUnescape} from 'escape-goat';

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
    cantCopy = window.navigator.clipboard ? false : true
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
  const copyToClipboard = async () => {
    if (!window.navigator.clipboard) {
      // Clipboard API not available
      return
    } else {
      console.log(window.location.href)
      const url = window.location.href
      try {
        await navigator.clipboard.writeText(url)
        toast.push('🎉 Copied URL')
      } catch (err) {
        console.error('Failed to copy!', err)
        toast.push('Failed to copy')
      }
    }
  }

  let cantCopy = true
</script>

<div class="guide">
  {#if status === 200 && api && api.machine_name}
    <button class:cantCopy class="copyURL" data-shadow on:click={() => copyToClipboard()}
      >Share results</button>
  {/if}
  <div class="wrapper flow">
    {#if status === 200 && api && api.machine_name}
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
                    <a
                      class="button"
                      href={download[1]}
                      download={download[1]}
                      id="download-band-{download[0]}">Download</a>
                    <span
                      ><strong>Filename:</strong>
                      {getFilename(download[1])}<br /><strong>Size:</strong>
                      {findSize(download[1], sizes)}</span>
                  </li>
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
    {:else}
      <h2>Data unavailable</h2>
      <p>We can't find data that matches you search criteria.</p>
      <a href="/" class="button modify">Modify criteria</a>
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

  .downloads .button {
    width: min-content;
    padding: var(--size-400) var(--size-300);
    display: inline-block;
    margin-right: var(--size-400);
    font-size: var(--size-400);
  }

  .cantCopy {
    display: none;
  }

  .downloads > li {
    display: inline-grid;
    grid-template-columns: 8rem 1fr;
    align-items: center;
    width: 100%;
  }

  .downloads {
    padding: 0;
  }

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

  .copyURL {
    position: absolute;
    cursor: pointer;
    left: auto;
    right: var(--size-400);
    border-radius: 12px;
    background: var(--color-primary);
    font-family: 'nowayregular', -apple-system, BlinkMacSystemFont, sans-serif;
    color: #fff;
    padding: 20px 16px;
    font-size: 21px;
    margin: 2rem auto 2rem 0;
    border: none;
    border-bottom: 2px solid #000;
    text-shadow: none;
    z-index: 99;
  }

  @media screen and (max-width: 48rem) {
    .copyURL {
      position: fixed;
      bottom: 0;
    }
  }

  .copyURL:hover,
  .copyURL:focus {
    box-shadow: none;
  }

  .copyURL:focus {
    background-color: var(--color-accent);
    color: var(--color-black);
  }
</style>
