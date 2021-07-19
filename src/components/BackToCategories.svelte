<script>
  export let toggle = () => {}
</script>

<div class="container backToCategories">
  <div class="content">
    <button on:click={toggle}>
      <span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          ><path
            fill="currentColor"
            d="M13.939 4.939L6.879 12 13.939 19.061 16.061 16.939 11.121 12 16.061 7.061z" /></svg>
      </span> Go back to categories
    </button>
  </div>
</div>

<style>
  button {
    background: none;
    border: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
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
