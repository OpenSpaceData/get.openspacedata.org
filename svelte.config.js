/** @type {import('@sveltejs/kit').Config} */
import preprocess from 'svelte-preprocess'
import md from 'mdsvex';
import adapter from '@sveltejs/adapter-netlify';
import Markdown from 'vite-plugin-md'

const config = {
	extensions: [".svelte", ".md", '.svx'],
	preprocess: [
		md.mdsvex({ extensions: ['.svx', '.md'] }),
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
		vite: () => ({
			plugins: [Markdown()]
		})
	}
};

export default config;