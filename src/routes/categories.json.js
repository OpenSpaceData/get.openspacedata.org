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
    const files = []
    for (const [filePath, resolver] of Object.entries(modules)) {
        files.push(filePath)
        const pathArray = filePath.split('/')
        const parentFolder = pathArray[pathArray.length - 2]
        const category = fs.readFileSync(path.join(__dirname, filePath), "utf-8")

        // Parse frontmatter
        const {
            data
        } = grayMatter(category)

        categories.push({
            ...data,
            parentFolder
        })
    }

    return {
        body: categories,
        modules,
        files
    };
}