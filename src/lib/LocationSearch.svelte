<script>
  import {MAPBOX_API} from '$lib/data/mapbox'
  import {location} from './store'
  import {Geocoder} from '@beyonk/svelte-mapbox'
</script>

<div class="locationSearch">
  <Geocoder
    accessToken={MAPBOX_API}
    options={{
      types: 'country, region, postcode, district, place, locality, neighborhood, address, poi',
    }}
    on:result={result => {
      location.set(result.detail.result)
    }} />
</div>

<style>
  .locationSearch {
    padding-left: 140px;
  }

  @media screen and (max-width: 48rem) {
    .locationSearch {
      padding-left: 0;
    }
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
    font-size: var(--size-500) !important;
    font-family: var(--bold-font) !important;
    height: auto !important;
    /* padding: 20px 50px; */
  }

  :global(.mapboxgl-ctrl-geocoder .suggestions-wrapper .suggestions li a) {
    font-family: var(--base-font);
    font-size: var(--size-400);
    text-shadow: none;
    background: none;
    border-bottom: 1px solid var(--color-dark-grey);
    padding: 6px 35px;
  }

  :global(.mapboxgl-ctrl-geocoder .suggestions) {
    position: relative !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }

  :global(.mapboxgl-ctrl-geocoder .suggestions li.active) {
    background: var(--color-accent);
  }
</style>
