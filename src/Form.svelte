<script>
  import Categories from "./Categories.svelte";
  import BackToCategories from "./BackToCategories.svelte";
  import Cases from "./Cases.svelte";
  import LocationSearch from "./LocationSearch.svelte";
  import TimeRange from "./TimeRange.svelte";

  let choice = { category: true };
  let form = { display: true };

  export function parentToggle() {
    choice.category = !choice.category;
  }
</script>

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
          <Categories toggle={parentToggle} />
        {:else}
          <BackToCategories toggle={parentToggle} />
          <Cases />
        {/if}
      </div>
    </div>
    <div class="use-cases">
      <div class="question-head">
        <div class="question-nr">
          <span>2</span>
        </div>
        <div class="question-title">
          Where do you want to analyzing green vegetation health?
        </div>
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
        <div class="question-title">
          What time range do you want to investigate?
        </div>
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
            In the next 20-30 minutes we will analyze the green vegetation on a
            satellite image showing the region you have chosen. For this we will
            use a scientific indicator - the Normalized Difference Vegetation
            Index. Or NDVI for short. Don't worry, it sounds more complicated
            than it is. We will guide you step-by-step through this process.
          </p>
          <p>
            At the end you will get a picture where healthy vegetation is
            colored green and unhealthy vegetation, i.e. vegetation with low or
            no chlorophyll content, is colored orange or red. This gives you a
            quick overview of the state of the vegetation in your study area.
          </p>
          <p>
            Don't worry, if you get stuck, just use our forum. We and other
            users are happy to help you.
          </p>
          <p>Sounds good? Then go ahead...</p>
        </div>
      </div>
      <div class="question-head">
        <div class="question-nr">
          <span>1</span>
        </div>
        <div class="question-title">Download your satellite imagery</div>
      </div>
      <div class="question-body">
        <div class="content">XXX</div>
      </div>
    </div>
  </div>
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
    font-family: "nowaybold", -apple-system, BlinkMacSystemFont, sans-serif;
    width: 90%;
    height: auto;
    float: left;
  }

  .question-nr {
    font-family: "nowaybold", -apple-system, BlinkMacSystemFont, sans-serif;
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
    font-family: "nowayregular", -apple-system, BlinkMacSystemFont, sans-serif;
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

  h1 {
    font-size: 300%;
    font-family: "nowaybold", -apple-system, BlinkMacSystemFont, sans-serif;
    line-height: 130%;
  }

  .guide p {
    font-family: "nowayregular", -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 120%;
    line-height: 150%;
  }
</style>
