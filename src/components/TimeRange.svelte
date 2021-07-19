<script>
  import {range} from '../store'
  let startDate, endDate
</script>

<div class="container">
  <div>
    <label>
      <input
        type="radio"
        name="timeRange"
        value="latest"
        on:click={() => ($range = {...$range, type: 'latest'})} />
      <span class="radioInput" />
      Gimme the latest imagery with best quality
    </label>
    <label>
      <input
        type="radio"
        on:click={() => ($range = {...$range, type: 'range'})}
        name="timeRange"
        value="range" />
      <span class="radioInput" />
      Let me set the time range myself
    </label>
  </div>
  {#if $range.type === 'range'}
    <!-- content here -->
    <div class="content horizontal">
      <div class="field fromDate">
        <img src="./build/assets/img/calendar.svg" alt="" />
        <input
          class="locationSearch shadow"
          type="date"
          placeholder="Start date"
          bind:value={startDate}
          on:blur={() => ($range = {...$range, startDate: startDate})} />
      </div>
      <p class="to">to</p>
      <div class="field toDate">
        <img src="./build/assets/img/calendar.svg" alt="" />
        <input
          class="locationSearch shadow"
          type="date"
          placeholder="End date"
          bind:value={endDate}
          on:blur={() => ($range = {...$range, endDate: endDate})} />
      </div>
    </div>
  {/if}
</div>

<style>
  div.horizontal {
    display: flex;
    align-items: center;
    justify-content: space-around;
    margin-bottom: 1rem;
  }

  div p.to {
    padding: 0 1rem;
  }

  div.field {
    display: flex;
    align-items: center;
  }

  div.field input {
    font-family: 'nowaymedium', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 16px;
    height: auto;
    box-sizing: border-box;
    padding: 20px 50px;
    list-style: none;
    border-radius: 15px;
    border: 2px solid #000;
    margin: 15px 0;
    box-shadow: #000 1px 2px 0;
  }

  label {
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: start;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  label > .radioInput {
    position: relative;
    height: 1.5rem;
    width: 1.5rem;
    border-radius: 100%;
    border: 2px solid #000;
  }

  label > input:checked + .radioInput::before {
    position: absolute;
    top: 0;
    left: 0;
    content: '';
    height: 1rem;
    width: 1rem;
    border-radius: 100%;
    border: 4px solid #fff;
    background: #000;
  }

  label > input[type='radio'] {
    display: none;
  }

  div.field img {
    position: absolute;
    padding: 20px 16px;
  }
</style>
