import fs from 'fs';
import path from 'path';
import marked from 'marked';
import grayMatter from 'gray-matter'
const __dirname = path.resolve(path.dirname(''));

export function get({
    params
}) {
    const {
        slug
    } = params;

    const modules =
        import.meta.glob(`/src/guides/**/cases/**/*.md`);


    let guides = [];
    let guideData = [];
    for (const [filePath, resolver] of Object.entries(modules)) {
        const pathArray = filePath.split('/')
        if (pathArray[5] === slug && pathArray[6] !== 'case.md') {
            guides.push(filePath)
        }
    }


    guides.map(filePath => {
        const guide = path.join(__dirname, filePath)

        // Parse frontmatter
        const {
            data,
            content
        } = grayMatter(guide)

        const renderer = new marked.Renderer();
        const html = marked(content, {
            renderer
        })

        guideData.push(guide)
    })

    return {
        body: guidesData
    }

}