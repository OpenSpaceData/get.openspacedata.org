<script>
  export let toggle = () => {};
</script>

<div class="categories">
  <button id="vegetation" on:click={toggle}>
    <span>Analyse vegetation and forestry</span>
  </button>
  <button id="floods" on:click={toggle}>
    <span>Study floods and droughts</span>
  </button>
  <button id="wildfire" on:click={toggle}>
    <span>Investigate wildfires</span>
  </button>
  <button id="water" on:click={toggle}>
    <span>Inspect ocean and water bodies</span>
  </button>
  <button id="urban" on:click={toggle}>
    <span>Check urban development</span>
  </button>
  <button id="snow" on:click={toggle}>
    <span>Examine snow and glacier</span>
  </button>
</div>

<style>
  div.categories {
    padding: 0;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    float: left;
  }

  button {
    width: 32%;
    height: 210px;
    margin-bottom: 2%;
    list-style: none;
    border-radius: 15px;
    display: flex;
    align-items: flex-end;
    padding: 20px;
    box-sizing: border-box;
    text-decoration: none;
    box-shadow: #000 1px 2px 0;
    transition-property: box-shadow;
    transition-duration: 0.5s;
    background-size: cover;
    border: 2px solid #000;
  }

  button:hover {
    box-shadow: rgba(0, 0, 0, 0.5) 0 0 30px;
  }

  button span {
    font-family: "nowaymedium", -apple-system, BlinkMacSystemFont, sans-serif;
    bottom: 0;
    font-size: 1.4rem;
    line-height: 1.6rem;
    color: #fff;
    text-shadow: rgba(0, 0, 0, 0.5) 0 0 5px;
    text-align: left;
  }

  #vegetation {
    background-image: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0.7)
      ),
      url("./assets/img/forest.jpg");
  }
  #floods {
    background-image: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0.7)
      ),
      url("./assets/img/earth.jpg");
  }
  #wildfire {
    background-image: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0.7)
      ),
      url("./assets/img/wildfire.jpg");
  }
  #water {
    background-image: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0.7)
      ),
      url("./assets/img/wave.jpg");
  }
  #urban {
    background-image: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0.7)
      ),
      url("./assets/img/city.jpg");
  }
  #snow {
    background-image: linear-gradient(
        to bottom,
        rgba(0, 0, 0, 0),
        rgba(0, 0, 0, 0.7)
      ),
      url("./assets/img/iceland.jpg");
  }
</style>
