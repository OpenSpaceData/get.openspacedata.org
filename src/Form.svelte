<script>
  import {fade} from 'svelte/transition'
  import Categories from './Categories.svelte'
  import BackToCategories from './components/BackToCategories.svelte'
  import Cases from './Cases.svelte'
  import LocationSearch from './components/LocationSearch.svelte'
  import TimeRange from './TimeRange.svelte'

  let choice = {category: true}
  let form = {display: true}

  export function parentToggle() {
    choice.category = !choice.category
  }
</script>

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
  }

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
</style>

{#if form.display}
  <div class="start-form">
    <div class="use-cases">
      <div class="question-head">
        <div class="question-nr">
          <span>1</span>
        </div>
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
    <div class="use-cases">
      <div class="question-head">
        <div class="question-nr">
          <span>2</span>
        </div>
        <div class="question-title">Where do you want to analyzing green vegetation health?</div>
      </div>
      <div class="question-body">
        <LocationSearch />
      </div>
    </div>
    <div class="use-cases">
      <div class="question-head">
        <div class="question-nr">
          <span>3</span>
        </div>
        <div class="question-title">What time range do you want to investigate?</div>
      </div>
      <div class="question-body">
        <TimeRange />
        <div class="container">
          <div class="content">
            <button>Alright! Get the data and start analyzing</button>
          </div>
        </div>
      </div>
    </div>
  </div>
{:else}
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
          <p>
            Here comes the content from <em>introduction.md</em> in the
            <em>guides</em> directory.
          </p>
        </div>
      </div>
      <div class="question-head">
        <div class="question-nr">
          <span>1</span>
        </div>
        <div class="question-title">Download your satellite imagery</div>
      </div>
      <div class="question-body">
        <div class="content">
          <p>
            First, you have to download the imagery directly from the European Space Agency. Sounds
            really exciting, right? But no problem for you: You just have to click the download
            buttons: 👇
          </p>
          <ul class="downloads">
            <li>
              <button>Download file S2A_33TUK_20210410_0_L2A/B02.tif</button>
            </li>
            <li>
              <button>Download file S2A_33TUK_20210410_0_L2A/B03.tif</button>
            </li>
            <li>
              <button>Download file S2A_33TUK_20210410_0_L2A/B04.tif</button>
            </li>
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
          <p>
            Here comes the content from <em>process.md</em> in the
            <em>guides</em> directory.
          </p>
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
          <p>
            Here comes the content from <em>interpret.md</em> in the
            <em>guides</em> directory.
          </p>
        </div>
      </div>
    </div>
  </div>
{/if}
