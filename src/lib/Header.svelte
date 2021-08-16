<header>
  <div class="wrapper">
    <div class="logo">
      <a href="/"><img src="/img/openspacedata-logo.png" alt="" height="64" width="140" /></a>
    </div>
    <nav>
      <ul>
        <li><a href="/about">About</a></li>
        <li><a href="/help">Help</a></li>
        <li>
          <a href="https://github.com/OpenSpaceData" class="svg"
            ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
              ><path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M12.026 2c-5.509 0-9.974 4.465-9.974 9.974 0 4.406 2.857 8.145 6.821 9.465.499.09.679-.217.679-.481 0-.237-.008-.865-.011-1.696-2.775.602-3.361-1.338-3.361-1.338-.452-1.152-1.107-1.459-1.107-1.459-.905-.619.069-.605.069-.605 1.002.07 1.527 1.028 1.527 1.028.89 1.524 2.336 1.084 2.902.829.091-.645.351-1.085.635-1.334-2.214-.251-4.542-1.107-4.542-4.93 0-1.087.389-1.979 1.024-2.675-.101-.253-.446-1.268.099-2.64 0 0 .837-.269 2.742 1.021a9.582 9.582 0 0 1 2.496-.336 9.554 9.554 0 0 1 2.496.336c1.906-1.291 2.742-1.021 2.742-1.021.545 1.372.203 2.387.099 2.64.64.696 1.024 1.587 1.024 2.675 0 3.833-2.33 4.675-4.552 4.922.355.308.675.916.675 1.846 0 1.334-.012 2.41-.012 2.737 0 .267.178.577.687.479C19.146 20.115 22 16.379 22 11.974 22 6.465 17.535 2 12.026 2z" /></svg
            ></a>
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
    aspect-ratio: 140/64;
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
