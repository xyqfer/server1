const cheerio = require('cheerio');
const got = require('got');
const lark = require('./utils/lark');

(async () => {
    const response = await got('https://www.cnblogs.com/grandyang/category/625406.html');
    const $ = cheerio.load(response.body);
    const $items = $('.entrylistItem');
    const count = $items.length;

    for (let i = 1; i <= 2; i++) {
        const index = Math.floor(Math.random() * count);
        const $item = $items.eq(index).find('.entrylistItemTitle');
        const link = $item.attr('href');
        const title = $item.text().trim();

        lark.sendPost(process.env.LARK_USER, {
            title: '',
            content: [
                [{
                    tag: 'a',
                    text: title,
                    href: link,
                }]
            ]
        });
    }
})();