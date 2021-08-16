<script>
  import Image from '$lib/Image.svelte'
</script>

<div class="text-center">
  <h2>This project is funded by</h2>
  <div class="fluid-grid three">
    <a href="https://bmbf.de/en"
      ><div>
        <Image
          path="/img/fund/BMBF_gefoerdert_2017_en.svg"
          alt="Logo for German Federal Ministry of Education & Research" />
      </div></a>
    <a href="https://okfn.de/en"
      ><div>
        <Image path="/img/fund/okfn.svg" alt="Logo for Open Knowledge Foundation Deutschland" />
      </div></a>
    <a href="https://prototypefund.de/en"
      ><div>
        <Image path="/img/fund/PrototypeFund-P-Logo.svg" alt="Logo for Prototype Fund" />
      </div></a>
  </div>
</div>

<style>
  .fluid-grid.three {
    justify-items: center;
  }

  @media screen and (max-width: 42rem) {
    .fluid-grid.three {
      grid-template-columns: 1fr 1fr;
    }
  }

  a,
  a:visited {
    background-image: none;
    text-shadow: none;
  }

  a > div {
    width: 120px;
    max-height: 120px;
    display: inline-flex;
  }

  .text-center {
    text-align: center;
  }
</style>
