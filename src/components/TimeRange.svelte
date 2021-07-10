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
        value="all"
        on:click={() => ($range = {...$range, type: 'all'})} />Gimme the latest imagery with best
      quality
    </label>
    <label>
      <input
        type="radio"
        on:click={() => ($range = {...$range, type: 'range'})}
        name="timeRange"
        value="range" />Let me set the time range myself
    </label>
  </div>
  {JSON.stringify($range)}
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

  div.field img {
    position: absolute;
    padding: 20px 16px;
  }
</style>
