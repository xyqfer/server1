const fs = require('fs');
const got = require('got');
const Git = require('simple-git/promise');

console.log('start');

(async () => {
    const data = await got.get('https://s3.cn-north-1.amazonaws.com.cn/leancloud-status/events.json').json();
    const events = data.events.slice(0, 5);

    console.log('get event data');

    const workDir = '/tmp';
    const userName = process.env.GIT_USER_NAME;
    const userEmail = process.env.GIT_USER_EMAIL;
    const password = process.env.GIT_PASSWORD;
    const repoName = 'db1';
    const filePath = `${workDir}/${repoName}/leancloud_status.json`;

    if (!fs.existsSync(`${workDir}/${repoName}`)) {
        const remote = `https://${userName}:${password}@github.com/${userName}/${repoName}`;
        let git = Git(workDir);
        await git.silent(false);
        await git.clone(remote);   
    }

    let newEvents = [];
    let dbData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    console.log('get db data');

    for (let event of events) {
        const index = dbData.findIndex((item) => {
            return item.time === event.time && item.content === event.content;
        });

        if (index === -1) {
            newEvents.push({
                time: event.time,
                content: event.content,
            });
        }
    }

    console.log('after filter');

    if (newEvents.length > 0) {
        console.log('begin commit')

        let data = newEvents.concat(dbData);
        if (data.length > 100) {
            data = data.slice(0, 50);
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

        let git = Git(`${workDir}/${repoName}`);
        await git.silent(false);
        await git.addConfig('user.name', userName);
        await git.addConfig('user.email', userEmail);
        await git.add('*');
        await git.commit('update leancloud status');
        await git.push('origin');

        console.log('after commit');

        for (let event of newEvents) {
            got.get(process.env.NOTIFICATION_URL + encodeURIComponent('LeanCloud Status') + '/' + encodeURIComponent(event.content));
        }

        console.log('after push');
    }
});