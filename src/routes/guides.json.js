import fs from 'fs';
import path from 'path';
import marked from 'marked';
import grayMatter from 'gray-matter'
const __dirname = path.resolve(path.dirname(''));
import * as cheerio from 'cheerio';
const mode = process.env.NODE_ENV
const guidesPath = mode === 'development' ? __dirname : '/opt/build/repo'

const groupBy = key => array =>
    array.reduce((objectsByKeyValue, obj) => {
        const value = obj[key];
        objectsByKeyValue[value] = (objectsByKeyValue[value] || []).concat(obj);
        return objectsByKeyValue;
    }, {});

const imageSrc = (html) => {
    const $ = cheerio.load(html);
    const images = $('img')
    $(images).each(function (i, elem) {
        const path = $(images[i]).attr('src')
        const src =
            mode === 'development' ?
            path :
            `https://res.cloudinary.com/itsfish/image/fetch/f_auto,q_auto/https://openspacedata.netlify.app${path}`


        $(images[i]).attr('src', src)
    });

    return $.html()
}

export async function get({
    params
}) {
    const modules =
        import.meta.glob(`/src/guides/**/*.md`);

    let guides = [];
    for (const [filePath, resolver] of Object.entries(modules)) {
        const guide = fs.readFileSync(path.join(guidesPath, filePath), "utf-8")

        // Parse frontmatter
        const {
            data,
            content
        } = grayMatter(guide)

        const renderer = new marked.Renderer();
        const html = await marked(content, {
            renderer
        })

        let optimHTML = await imageSrc(html)

        guides.push({
            case: data.case,
            content: data.content,
            html: optimHTML
        })
    }

    // if (!match) {
    // 	return {
    // 		status: 404
    // 	};
    // }
    const groupByCase = groupBy('case')
    const cases = Object.keys(groupByCase(guides))
    const merged = cases.map(value => {
        const relatedCases = guides.filter(guide => guide.case === value)
        const content = relatedCases.reduce((acc, key) => ({
            ...acc,
            [key.content]: [key.html]
        }), {})
        return {
            value,
            content
        }
    })

    return {
        body: merged
    };
}