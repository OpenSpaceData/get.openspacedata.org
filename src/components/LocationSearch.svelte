<script>
  import {location} from '../store'
  import {Geocoder} from '@beyonk/svelte-mapbox'
</script>

<div class="container">
  <div class="content">
    <div class="locationSearch">
      <!-- <img src="./build/assets/img/navigation.svg" alt="" />
      <input
        class="locationSearch shadow"
        type="text"
        placeholder="Type your location"
        bind:value={$location} /> -->
      <Geocoder
        accessToken="%MAPBOX_API%"
        options={{types: 'country, region, postcode, district'}}
        on:result={result => {
          console.log(result)
          location.set(result.detail.result)
        }} />
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

  :global(.mapboxgl-ctrl) {
    width: 100% !important;
    max-width: 100% !important;
  }
  :global(.mapboxgl-ctrl-geocoder) {
    width: 100% !important;
    max-width: 100% !important;
    border: 2px solid black !important;
    box-shadow: #000 1px 2px 0 !important;
  }

  :global(.mapboxgl-ctrl-geocoder--input) {
    font-size: 1rem !important;
    height: auto !important;
    /* padding: 20px 50px; */
  }
</style>
