const mode = process.env.NODE_ENV
const guidesPath = mode === 'development' ? 'http://localhost:3000/guides.json' : 'https://focused-morse-24be4b.netlify.app/guides.json'

export async function get({
    params
}) {
    const {
        slug
    } = params;

    const guides = await fetch(guidesPath).then(res => res.json())
    const content = guides.filter(guide => guide.value === slug)
    const guideContent = {
        ...content[0]
    }

    return {
        body: guideContent
    }
}