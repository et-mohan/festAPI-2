const PORT = 3000;

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();

app.get('/', function (req, res) {
    res.json("Hello, welcome to my website.");
});

app.get('/fests', async function (req, res) {
    try {
        const response = await axios.get('https://www.knowafest.com/explore/state/Tamil-Nadu');
        const html = response.data;
        const $ = cheerio.load(html);

        // Array to store promises for fetching event data
        const eventDataPromises = [];

        $('table:contains(tr) tr:not(:first-child)').each((index, element) => {
            const eventUrl = $(element).attr('onclick');
            const modifiedEventurl = eventUrl.replace("window.open('..", '').replace("' );", '');
            const mainUrl = 'https://www.knowafest.com/explore' + modifiedEventurl;
            
            // Push promise to fetch event data into the array
            eventDataPromises.push(
                axios.get(mainUrl)
                    .then(response => {
                        const html1 = response.data;
                        const $1 = cheerio.load(html1);
                        const registerLink = $1('a:contains("Register now")').attr('href');
                        return {
                            registerLink: registerLink
                        };
                    })
                    .catch(err => {
                        // Handle individual request errors
                        console.error(err);
                        return { registerLink: null }; // Return null in case of error
                    })
            );
        });

        // Wait for all promises to resolve
        const eventData = await Promise.all(eventDataPromises);
        
        res.json({
            status: 'success',
            data: eventData
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
