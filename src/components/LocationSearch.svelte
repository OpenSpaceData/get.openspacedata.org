<script>
  import {location} from '../store'
</script>

<div class="container backToCategories">
  <div class="content">
    <div class="locationSearch">
      <img src="./build/assets/img/navigation.svg" alt="" />
      <input
        class="locationSearch shadow"
        type="text"
        placeholder="Type your location"
        bind:value={$location} />
    </div>
  </div>
</div>

<style>
  div.locationSearch input {
    font-family: 'nowaymedium', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 16px;
    height: auto;
    width: 100%;
    box-sizing: border-box;
    padding: 20px 50px;
    list-style: none;
    display: flex;
    align-items: center;
    border-radius: 15px;
    border: 2px solid #000;
    margin: 15px 0;
    box-shadow: #000 1px 2px 0;
  }

  div.locationSearch img {
    position: absolute;
    padding: 20px 16px;
  }
</style>
