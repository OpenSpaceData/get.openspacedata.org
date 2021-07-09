<script>
</script>

<div class="container">
  <div class="content horizontal">
    <div class="field fromDate">
      <img src="./build/assets/img/calendar.svg" alt="" />
      <input
        class="locationSearch shadow"
        type="date"
        placeholder="Start date"
      />
    </div>
    <p class="to">to</p>
    <div class="field toDate">
      <img src="./build/assets/img/calendar.svg" alt="" />
      <input class="locationSearch shadow" type="date" placeholder="End date" />
    </div>
  </div>
</div>

<style>
  div.horizontal {
    display: flex;
    align-items: center;
    justify-content: space-around;
  }

  div p.to {
    padding: 0 1rem;
  }

  div.field {
    display: flex;
    align-items: center;
  }

  div.field input {
    font-family: "nowaymedium", -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 16px;
    height: auto;
    box-sizing: border-box;
    padding: 20px 50px;
    list-style: none;
    border-radius: 15px;
    border: 2px solid #000;
    margin: 15px 0;
    box-shadow: #000 1px 2px 0;
  }

  div.field img {
    position: absolute;
    padding: 20px 16px;
  }
</style>
