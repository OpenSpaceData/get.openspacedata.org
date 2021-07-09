<script>
  export let toggle = () => {};
</script>

<div class="container backToCategories">
  <div class="content">
    <button on:click={toggle}>
      <span>←</span> Go back to categories
    </button>
  </div>
</div>

<style>
  button {
    background: none;
    border: 0;
  }

  span {
    height: 25px;
    width: 25px;
    border-radius: 50%;
    border: 2px solid #000;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 5px;
    box-shadow: #000 1px 2px 0;
  }
</style>
