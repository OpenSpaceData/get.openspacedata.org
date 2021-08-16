<script>
  export let path
  export let alt = ''
  export let height
  export let width
  export let id

  const src =
    process.env.NODE_ENV === 'development'
      ? path
      : `https://res.cloudinary.com/itsfish/image/fetch/f_auto,q_auto/https://openspacedata.netlify.app${path}`
</script>

<img {src} {alt} {height} {width} {id} />
