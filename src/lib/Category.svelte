<script>
  import {onMount} from 'svelte'
  import {category} from './store'
  import {fade, fly} from 'svelte/transition'
  // import { categories } from './data/categories';
  import Case from './Case.svelte'
  import Back from './BackToCategories.svelte'

  const setChoice = option => {
    category.set(option)
  }

  let choosing = false
  let categories
  onMount(async () => {
    // Get the content for the guide
    categories = await fetch('/categories.json').then(resp => resp.json())
  })
</script>

<div>
  {#if !choosing && categories}
    <!-- content here -->
    <div class="auto-grid categories" out:fade|local={{duration: 150}} in:fade|local={{delay: 150}}>
      {#each categories as cat}
        <button
          id={cat.id}
          on:click={() => {
            choosing = true
            setChoice(cat)
          }}>
          {cat.text}
        </button>
      {/each}
    </div>
  {:else}
    <div out:fade|local={{duration: 150}} in:fade|local={{delay: 150}}>
      {#if choosing}
        <!-- content here -->
        <Back bind:choosing />
      {/if}
      <!-- else content here -->
      <Case />
    </div>
  {/if}
</div>

<style>
  div.categories {
    --auto-grid-cols: 3;
  }

  button {
    width: 100%;
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
    cursor: pointer;
  }

  button:hover {
    box-shadow: rgba(0, 0, 0, 0.5) 0 0 30px;
  }

  button {
    font-family: 'nowaymedium', -apple-system, BlinkMacSystemFont, sans-serif;
    bottom: 0;
    font-size: var(--size-600);
    color: var(--light-text-color);
    text-shadow: rgba(0, 0, 0, 0.5) 0 0 5px;
    text-align: left;
  }

  #vegetation {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/forest.jpg');
  }
  #floods {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/earth.jpg');
  }
  #wildfire {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/wildfire.jpg');
  }
  #water {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/wave.jpg');
  }
  #urban {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/city.jpg');
  }
  #snow {
    background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7)),
      url('/img/iceland.jpg');
  }
</style>
