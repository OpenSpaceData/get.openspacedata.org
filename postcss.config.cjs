const postcssNested = require('postcss-nested')
const postcssImport = require('postcss-import')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')

const mode = process.env.NODE_ENV
const dev = mode === 'development'

module.exports = {
  plugins: [
    postcssNested,
    postcssImport,
    autoprefixer,
    !dev &&
    cssnano({
      preset: 'default'
    })
  ]
}