import fs from 'fs';
import path from 'path';
import marked from 'marked';
import grayMatter from 'gray-matter'
const __dirname = path.resolve(path.dirname(''));

export async function get({
    params
}) {
    const modules =
        import.meta.glob(`/src/guides/*/category.md`);

    let categories = [];
    for (const [filePath, resolver] of Object.entries(modules)) {
        const pathArray = filePath.split('/')
        const parentFolder = pathArray[pathArray.length - 2]
        const category = path.join(__dirname, filePath)

        // Parse frontmatter
        const {
            data
        } = grayMatter(category)

        categories.push(category)
    }

    return {
        body: categories
    };
}