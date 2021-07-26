/** @type {import('@sveltejs/kit').Config} */
import preprocess from 'svelte-preprocess'

const config = {
	extensions: [".svelte", ".md"],
	preprocess: [
		preprocess({
		  defaults: {
			style: 'postcss'
		  },
		  postcss: true
		})
	  ],

	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte'
	}
};

export default config;
