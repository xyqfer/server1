const fs = require('fs');
const Parser = require('rss-parser');
const parser = new Parser();
const utils = require('./utils');
const lark = require('./utils/lark');
const translate = require('./utils/deepl');

(async () => {
    const repoName = 'db1';
    const filePath = `${utils.DB_ROOT}/${repoName}/wsj.json`;

    await utils.initDb(repoName);

    let dbData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let newData = [];

    const feed = await parser.parseURL(process.env.RSS_HOST + '/twitter/user/WSJ');
    for (let item of feed.items) {
        if (!dbData.includes(item.link)) {
            newData.push(item);
        }
    }

    if (newData.length > 0) {
        newData = newData.slice(0, 2);
        
        let list = newData.map((item) => {
            return item.link;
        });
        let data = list.concat(dbData);
        if (data.length > 200) {
            data = data.slice(0, 100);
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        await utils.commitDb(repoName, 'update wsj');

        for (let item of newData) {
            const zhText = translate(item.title);

            lark.sendPost(process.env.LARK_USER, {
                title: '',
                content: [
                    [{
                        tag: 'text',
                        text: item.title
                    }],
                    [{
                        tag: 'text',
                        text: '---'
                    }],
                    [{
                        tag: 'text',
                        text: zhText
                    }]
                ]
            });
        }
    }
})();