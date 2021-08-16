// THIS ALSO DOES NOT WORK

const fetch = require("node-fetch");

exports.handler = async (event, context) => {
    let headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        "content-type": "application/json;charset=UTF-8"
    };

    const apiCase = event.queryStringParameters.case
    const startDate = event.queryStringParameters.from
    const endDate = event.queryStringParameters.to
    const location = event.queryStringParameters.location

    try {
        const req = await fetch(`https://openspacedata.pythonanywhere.com/v1/${apiCase}/?format=json&from=${startDate}&to=${endDate}&location=[${location}]`, {
            "headers": {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "accept-language": "en-AU,en-US;q=0.9,en;q=0.8,zh-TW;q=0.7,zh;q=0.6",
                "authorization": "Basic b3BlbnNwYWNlZGF0YTpvcGVuc3BhY2VkYXRh",
                "cache-control": "no-cache",
                "pragma": "no-cache",
                "sec-ch-ua": "\"Chromium\";v=\"92\", \" Not A;Brand\";v=\"99\", \"Microsoft Edge\";v=\"92\"",
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1"
            },
            // "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            // "mode": "cors"
        })

        const resp = await req.json()

        return {
            statusCode: 200,
            body: JSON.stringify({
                resp
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