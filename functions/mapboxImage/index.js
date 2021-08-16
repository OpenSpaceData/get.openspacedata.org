// THIS DOESN'T WORK YET!

const fetch = require("node-fetch");

exports.handler = async (event, context) => {
    let headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*'
    };

    const bbox = event.queryStringParameters.bbox

    try {
        const req = await fetch(`https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/static/[${bbox}]/120x120?access_token=pk.eyJ1Ijoib3BlbnNwYWNlZGF0YSIsImEiOiJja3J0dGRyNnowdm92MnVucGUyNnRrbDV1In0.3GtPOoLlH79KIJhoRSn9TQ`, {
                "method": "GET",
            })
            .then(data => data.blob())

        console.log(req)


        return {
            statusCode: 200,
            headers: {
                headers,
                "Content-Type": "image/png",
            },
            body: req.toString("base64"),
            isBase64Encoded: true,
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