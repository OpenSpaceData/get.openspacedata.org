<script>
  import {cases as choices} from './data/cases'
  console.log(choices)

  const capitalize = str => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  let selected
</script>

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
    align-items: center;
    border-radius: 15px;
    border: 2px solid #000;
    margin: 15px 0;
  }

  .task {
    flex-grow: 1;
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
    background: #ffbd12;
    padding: 10px 12px;
    margin-left: 20px;
    font-family: 'nowayregular', -apple-system, BlinkMacSystemFont, sans-serif;
    cursor: pointer;
  }

  button.help {
    border-radius: 100%;
    width: 43px;
    height: 43px;
    font-family: 'nowaybold', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 120%;
  }

  .selected {
    background: #1947e5;
    color: #fff;
    transition: all 0.3s;
  }
</style>

<div class="container">
  <div class="content">
    {#each choices as choice}
      <p>{choice.intro}</p>
      <ul class="indices">
        {#each choice.options as option, index}
          <li class="shadow" class:selected={selected === index}>
            <div class="task">
              <h2>{option.heading}</h2>
              <span>Difficulty: {capitalize(option.difficulty)}</span>
            </div>
            <button class="help">?</button>
            <button id={index} class="take-indice" on:click={() => (selected = index)}
              >Take this</button>
          </li>
        {/each}
      </ul>
    {/each}
  </div>
</div>
