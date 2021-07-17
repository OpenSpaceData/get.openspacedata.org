<!-- src/Markdown.svelte -->
<script>
    import { onMount, beforeUpdate } from 'svelte';
    import MarkdownIt from 'markdown-it'
  
    export let folder = ''
    export let file = ''
    let markdown = ''
    let rendered = ''
  
    // Initialize `markdown-it`
    const md = new MarkdownIt()

    onMount(async () => {
        // in the real thing this file path would be a string created depending on what link was clicked
        const filePath = `/guides/${folder}/${file}.md`;
        markdown = await fetch(filePath).then(resp => resp.text())
        // Render to an html string
        rendered = await md.render(markdown)
    });
  
  </script>
  
  <!-- Render with the `@html` directive -->
  <div>
    {@html rendered}
  </div>