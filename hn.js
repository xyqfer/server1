const url = require('url');
const cheerio = require('cheerio');
const got = require('got');
const lark = require('./utils/lark');

(async () => {
    const yesterday = new Date(Date.now() - (25 * 60 * 60 * 1000));
    const year = yesterday.getFullYear();

    let month = yesterday.getMonth() + 1;
    if (month < 10) month = '0' + month;

    let date = yesterday.getDate();
    if (date < 10) date = '0' + date;

    const time = `${year}-${month}-${date}`;
    const response = await got(`https://www.daemonology.net/hn-daily/${time}.html`);
    const $ = cheerio.load(response.body);

    const timeMap = {
        '2': 0,
        '4': 2,
        '6': 4,
        '8': 6,
        '10': 8,
    };
    const now = (new Date()).getHours();
    let start = timeMap[now];
    if (start == null) start = 0;

    let list = $('ul > li').map(function() {
        const $item = $(this);
        const title = $item.find('.storylink > a').text();
        const { id } = url.parse($item.find('.postlink > a').attr('href'), true).query;

        return {
            title,
            id,
        };
    }).get().slice(start, start + 2);

    for (let item of list) {
        lark.sendPost(process.env.LARK_USER, {
            title: item.title,
            content: [
                [{
                    tag: 'a',
                    text: '[链接]',
                    href: `${process.env.API_HOST}/hn/m/#!/item/${item.id}`,
                }]
            ]
        });
    }
})();