<script>
  import {page} from '$app/stores'
  import github from '$lib/svg/github-logo.svg'
  import InlineSVG from 'svelte-inline-svg'
</script>

<header>
  <div class="wrapper">
    <div class="logo">
      <a href="/"><img src="/img/openspacedata-logo.png" alt="" /></a>
    </div>
    <nav>
      <ul>
        <li><a href="/about">About</a></li>
        <li><a href="/help">Help</a></li>
        <li>
          <a href="https://github.com/OpenSpaceData" class="svg"><InlineSVG src={github} /></a>
        </li>
      </ul>
    </nav>
  </div>
</header>

<style>
  header {
    /* font-size: 1.8rem; */
    background-color: var(--color-black);
    margin-bottom: var(--size-600);
    max-height: 8rem;
    min-height: 4rem;
    font-size: var(--size-500);
    padding: var(--size-300) 0;
    color: var(--light-text-color);
    /* overflow: hidden; */
  }

  header .logo {
    text-align: center;
    width: 100%;
    max-height: 4rem;
  }

  .logo a {
    text-decoration: none;
    background-image: none;
    text-shadow: none;
  }

  header .logo img {
    max-height: 4rem;
  }

  /* header .wrapper {
  flex-wrap: wrap;
  overflow: hidden;
} */

  header nav ul {
    display: flex;
    justify-content: center;
    --gap: var(--size-400);
    flex-wrap: wrap;
    margin: calc(-1 * var(--gap)) 0 0 calc(-1 * var(--gap));
    width: calc(100% + var(--gap));
    list-style: none;
  }

  header nav ul > * {
    margin: var(--gap);
  }

  header nav ul a.svg {
    text-shadow: none;
    background: none;
    display: inline-grid;
    place-items: center;
    height: 100%;
  }

  :global(header nav ul a.svg svg) {
    fill: currentColor;
  }

  :global(header nav ul a.svg:hover svg) {
    fill: var(--color-accent);
  }

  header nav {
    /* background-color: var(--dark-green); */
    width: 100vw;
    padding: var(--size-300) 0;
    /* color: var(--lightest); */
    /* margin: 0 calc(var(--size-700) * -1); */
  }

  @media (min-width: 36rem) {
    header {
      padding: var(--size-500) 0;
    }

    header .logo {
      margin-bottom: 0;
      /* text-align: left; */
    }
  }

  @media (min-width: 48rem) {
    header .logo {
      text-align: left;
      width: initial;
    }

    header nav {
      width: initial;
      /* background-color: var(--light-green); */
      /* color: var(--darker); */
    }
  }
</style>
