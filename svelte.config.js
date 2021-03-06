/** @type {import('@sveltejs/kit').Config} */
import preprocess from 'svelte-preprocess'
import md from 'mdsvex';
import adapter from '@sveltejs/adapter-netlify';

const config = {
	extensions: [".svelte", ".md", '.svx'],
	preprocess: [
		md.mdsvex(),
		preprocess({
			defaults: {
				style: 'postcss'
			},
			postcss: true
		})
	],

	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		adapter: adapter(),
	}
};

export default config;