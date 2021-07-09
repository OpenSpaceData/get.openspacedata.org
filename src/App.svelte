<script>
  import Form from "./Form.svelte";
</script>

<div class="wrapper">
  <Form />
</div>

<style>
  @font-face {
    font-family: "nowayregular";
    src: url("./assets/fonts/noway-regular-webfont.eot");
    src: url("./assets/fonts/noway-regular-webfont.eot?#iefix")
        format("embedded-opentype"),
      url("./assets/fonts/noway-regular-webfont.woff2") format("woff2"),
      url("./assets/fonts/noway-regular-webfont.woff") format("woff"),
      url("./assets/fonts/noway-regular-webfont.ttf") format("truetype"),
      url("./assets/fonts/noway-regular-webfont.svg#nowayregular") format("svg");
    font-weight: normal;
    font-style: normal;
  }

  @font-face {
    font-family: "nowaymedium";
    src: url("./assets/fonts/noway-medium-webfont.eot");
    src: url("./assets/fonts/noway-medium-webfont.eot?#iefix")
        format("embedded-opentype"),
      url("./assets/fonts/noway-medium-webfont.woff2") format("woff2"),
      url("./assets/fonts/noway-medium-webfont.woff") format("woff"),
      url("./assets/fonts/noway-medium-webfont.ttf") format("truetype"),
      url("./assets/fonts/noway-medium-webfont.svg#nowayregular") format("svg");
    font-weight: normal;
    font-style: normal;
  }

  @font-face {
    font-family: "nowaybold";
    src: url("./assets/fonts/noway-bold-webfont.eot");
    src: url("./assets/fonts/noway-bold-webfont.eot?#iefix")
        format("embedded-opentype"),
      url("./assets/fonts/noway-bold-webfont.woff2") format("woff2"),
      url("./assets/fonts/noway-bold-webfont.woff") format("woff"),
      url("./assets/fonts/noway-bold-webfont.ttf") format("truetype"),
      url("./assets/fonts/noway-bold-webfont.svg#nowayregular") format("svg");
    font-weight: bold;
    font-style: normal;
  }

  @font-face {
    font-family: "nowayitalic";
    src: url("./assets/fonts/noway_regular_italic-webfont.eot");
    src: url("./assets/fonts/noway_regular_italic-webfont.eot?#iefix")
        format("embedded-opentype"),
      url("./assets/fonts/noway_regular_italic-webfont.woff2") format("woff2"),
      url("./assets/fonts/noway_regular_italic-webfont.woff") format("woff"),
      url("./assets/fonts/noway_regular_italic-webfont.ttf") format("truetype"),
      url("./assets/fonts/noway_regular_italic-webfont.svg#nowayregular")
        format("svg");
    font-weight: normal;
    font-style: italic;
  }

  :global(html) {
    font-family: "nowayregular", -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 16px;
    word-spacing: 1px;
    -ms-text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
    box-sizing: border-box;
  }

  :global(h1),
  :global(h2),
  :global(h3),
  :global(h4),
  :global(h5),
  :global(h6) {
    font-family: "nowaybold", -apple-system, BlinkMacSystemFont, sans-serif;
  }

  :global(h1) {
    font-size: 300%;
    line-height: 130%;
  }

  :global(h3) {
    font-size: 150%;
    line-height: 130%;
    margin-bottom: 0rem;
  }

  .wrapper {
    max-width: 940px;
    margin: 0 auto;
  }

  :global(.container) {
    max-width: 675px;
    margin: 0 auto;
    font-weight: bold;
  }

  :global(.content) {
    margin-left: 10%;
    width: 90%;
    height: auto;
    float: left;
  }

  :global(.content a) {
    text-decoration: none;
    color: #000;
  }

  :global(strong) {
    font-family: "nowaybold";
  }
</style>
