const fs = require('fs');
const got = require('got');
const utils = require('./utils');

(async () => {
    const data = await got.get('https://s3.cn-north-1.amazonaws.com.cn/leancloud-status/events.json').json();
    const events = data.events.slice(0, 5).map((item) => {
        return {
            time: item.time,
            content: item.content,
        };
    });

    const repoName = 'db1';
    const filePath = `${utils.DB_ROOT}/${repoName}/leancloud_status.json`;

    await utils.initDb(repoName);

    let dbData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let newEvents = utils.getNewData(dbData, events, ['time', 'event']);

    if (newEvents.length > 0) {
        let data = newEvents.concat(dbData);
        if (data.length > 100) {
            data = data.slice(0, 50);
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        await utils.commitDb(repoName, 'update leancloud status');

        for (let event of newEvents) {
            utils.sendNotification('LeanCloud Status', event.content);
        }
    }
})();