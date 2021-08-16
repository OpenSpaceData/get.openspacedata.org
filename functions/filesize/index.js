const fetch = require("node-fetch");

exports.handler = async (event, context) => {
    let headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*'
    };

    const image = event.queryStringParameters.image

    try {
        const originalResponse = await fetch(image)
        const length = originalResponse.headers.get("content-length")

        return {
            statusCode: 200,
            body: JSON.stringify({
                length
            }),
            headers: headers
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed fetching data'
            }),
        };
    }
};