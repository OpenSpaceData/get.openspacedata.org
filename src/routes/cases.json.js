import fs from 'fs';
import path from 'path';
import marked from 'marked';
import grayMatter from 'gray-matter'
const __dirname = path.resolve(path.dirname(''));

export async function get({
    params
}) {
    const modules =
        import.meta.glob(`/src/guides/*/cases/**/case.md`);

    let cases = [];
    for (const [filePath, resolver] of Object.entries(modules)) {
        const pathArray = filePath.split('/')
        const parentFolder = pathArray[pathArray.length - 4]
        const caseFolder = pathArray[pathArray.length - 2]
        const
            c = fs.readFileSync(path.join(__dirname, filePath), "utf-8")

        // Parse frontmatter
        const {
            data
        } = grayMatter(
            c)

        cases.push({
            ...data,
            parentFolder,
            caseFolder
        })
    }

    return {
        body: cases
    };
}