<script>
  import {keys} from 'markdown-it/lib/common/html_blocks'

  import {onMount} from 'svelte'
  import Markdown from './components/Markdown.svelte'
  import {choice as selected, location, range} from './store'

  const rangeType = $range.type
  /*
  If the rangeType === 'latest' then set a startDate of 2 months ago & an endDate of today.
  If it is a 'range' then send through the range dates set by the user.
  */

  let downloads = []

  const getFilename = file => {
    const url = new URL(file).pathname.split('/')
    const filename = `${url[url.length - 2]}/${url[url.length - 1]}`
    return filename
  }

  onMount(async () => {
    /*
    Temporary use of json file.
    Todo: Send request to API using 
    http://api.openspacedata.org/v1/{USE_CASE}/?from={startDate}&to={endDate}&location={location}&location=[ARRAY of bbox values from Mapbox]
    */
    const api = await fetch('/api-respond.json').then(resp => resp.json())
    const {files, bands} = api
    const filesRegex = /B.{2}/g

    downloads = await files
      .map(file => {
        return Object.entries(file).filter(entry => {
          if (entry[0].match(filesRegex)) {
            return entry
          }
        })
      })
      .flat()

    // console.log(downloads)
  })
</script>

<div class="guide">
  <div class="container">
    <h1>Well done! And now there' s the fun part:</h1>
    <div class="question-head">
      <div class="question-nr">
        <span class="no-fill">?</span>
      </div>
      <div class="question-title">What are we going to do?</div>
    </div>
    <div class="question-body">
      <div class="content">
        <Markdown folder={$selected.guide} file="introduction" />
      </div>
    </div>
    <div class="question-head">
      <div class="question-nr">
        <span>1</span>
      </div>
      <div class="question-title">Download your satellite imagery for {$location.place_name}</div>
    </div>
    <div class="question-body">
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
        <h3>Why I have to download multiple files?</h3>
        <p>Good question! Here comes the answer. Lorem ipsum...</p>
      </div>
    </div>
    <div class="question-head">
      <div class="question-nr">
        <span>2</span>
      </div>
      <div class="question-title">Process the image</div>
    </div>
    <div class="question-body">
      <div class="content">
        <Markdown folder={$selected.guide} file="process" />
      </div>
    </div>
    <div class="question-head">
      <div class="question-nr">
        <span>3</span>
      </div>
      <div class="question-title">Interpret the data right</div>
    </div>
    <div class="question-body">
      <div class="content">
        <Markdown folder={$selected.guide} file="interpret" />
      </div>
    </div>
  </div>
</div>

<style>
  /***************/
  /**** GUIDE ****/
  /***************/

  .guide p {
    font-family: 'nowayregular', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 120%;
    line-height: 150%;
  }

  ul.downloads {
    list-style: none;
    padding: 0;
  }

  ul.downloads button {
    margin: 0.5rem 0 0.5rem 0;
  }

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
    max-width: 940px;
    margin: 0 auto;
    clear: both;
    vertical-align: middle;
  }

  .question-head {
    max-width: 675px;
    margin: 0 auto;
    font-weight: bold;
    font-size: 30px;
    padding: 2rem 0;
  }

  .question-title {
    font-family: 'nowaybold', -apple-system, BlinkMacSystemFont, sans-serif;
    width: 90%;
    height: auto;
    float: left;
  }

  .question-nr {
    font-family: 'nowaybold', -apple-system, BlinkMacSystemFont, sans-serif;
    height: auto;
    width: 10%;
    float: left;
  }

  .question-nr span {
    height: 44px;
    width: 44px;
    background-color: #000;
    border-radius: 50%;
    border: 3px #000 solid;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
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

  button,
  a[download] {
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

  a[download] {
    display: block;
  }
</style>
