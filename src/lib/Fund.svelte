<script>
  import Image from '$lib/Image.svelte'
</script>

<div class="text-center">
  <h2>This project is funded by</h2>
  <div class="fluid-grid three">
    <a href="https://bmbf.de/en"
      ><Image
        path="/img/fund/BMBF_gefoerdert_2017_en.svg"
        alt="Logo for German Federal Ministry of Education & Research" /></a>
    <a href="https://okfn.de/en"
      ><Image path="/img/fund/okfn.svg" alt="Logo for Open Knowledge Foundation Deutschland" /></a>
    <a href="https://prototypefund.de/en"
      ><Image path="/img/fund/PrototypeFund-P-Logo.svg" alt="Logo for Prototype Fund" /></a>
  </div>
</div>

<style>
  .fluid-grid.three {
    justify-items: center;
  }

  a,
  a:visited {
    background-image: none;
    text-shadow: none;
  }

  img {
    height: 120px;
  }

  .text-center {
    text-align: center;
  }
</style>
