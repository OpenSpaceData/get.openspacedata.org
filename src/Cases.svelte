<script>
  import {choice, category} from './store'
  const choices = $category.cases.options

  let selected

  const capitalize = str => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const setChoice = option => {
    choice.set(option)
  }
</script>

<div class="container">
  <div class="content">
    <p>{$category.cases.intro}</p>
    {#each choices as choice, index}
      <ul class="indices">
        <li class="shadow" class:selected={selected === index}>
          <div class="task">
            <h2>{choice.heading}</h2>
            <span>Difficulty: {capitalize(choice.difficulty)}</span>
          </div>
          <div class="action">
            <button class="help">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                ><path
                  fill="currentColor"
                  d="M12 4C9.243 4 7 6.243 7 9h2c0-1.654 1.346-3 3-3s3 1.346 3 3c0 1.069-.454 1.465-1.481 2.255-.382.294-.813.626-1.226 1.038C10.981 13.604 10.995 14.897 11 15v2h2v-2.009c0-.024.023-.601.707-1.284.32-.32.682-.598 1.031-.867C15.798 12.024 17 11.1 17 9 17 6.243 14.757 4 12 4zM11 18H13V20H11z" /></svg>
            </button>
            {#if !(selected === index)}
              <button
                id={index}
                class="take-indice"
                on:click={() => {
                  selected = index
                  setChoice(choice)
                }}>Take this</button>
            {:else}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                class="selected"
                ><path
                  fill="#fff"
                  d="M10 15.586L6.707 12.293 5.293 13.707 10 18.414 19.707 8.707 18.293 7.293z" /></svg>
            {/if}
          </div>
        </li>
      </ul>
    {/each}
  </div>
</div>

<style>
  ul.indices {
    padding: 0;
    margin: 0;
  }

  ul.indices li {
    box-shadow: #000 1px 2px 0;
    height: auto;
    width: 100%;
    box-sizing: border-box;
    padding: 20px 16px;
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-radius: 15px;
    border: 2px solid #000;
    margin: 15px 0;
  }

  .task {
    /* flex-grow: 1; */
    transition: all 0.15s;
  }

  .task > span {
    color: var(--color-dark-grey);
    transition: all 0.15s;
  }
  .selected > .task {
    color: var(--color-white);
  }
  .selected > .task > span {
    color: var(--color-white);
  }
  .selected > .task > span {
    color: var(--color-white);
  }

  .action {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .action > svg {
    height: 3rem;
    width: 5.5rem;
  }

  h2 {
    margin: 0;
    font-family: 'nowaymedium', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  button {
    border: 2px solid #000;
    padding: 10px;
    font-size: 16px;
    box-shadow: #000 1px 2px 0;
  }

  button.take-indice {
    border-radius: 12px;
    background: var(--color-secondary-action);
    padding: 10px 12px;
    font-family: 'nowayregular', -apple-system, BlinkMacSystemFont, sans-serif;
    cursor: pointer;
  }

  button.help {
    border-radius: 100%;
    font-family: 'nowaybold', -apple-system, BlinkMacSystemFont, sans-serif;
    display: grid;
    justify-content: center;
    align-items: center;
    place-items: center;
  }

  .selected {
    background: var(--color-secondary-action);
    /* color: #fff; */
    transition: all 0.3s;
  }
</style>
