const fs = require('fs');
const got = require('got');
const _ = require('lodash');
const Git = require('simple-git/promise');

const sendNotification = (title = '', content = '') => {
    got.get(process.env.NOTIFICATION_URL + encodeURIComponent(title) + '/' + encodeURIComponent(content));
};

const DB_ROOT = '/tmp';
const { GIT_USER_NAME, GIT_USER_EMAIL, GIT_PASSWORD } = process.env;

const initDb = async (repoName) => {
    if (!fs.existsSync(`${DB_ROOT}/${repoName}`)) {
        const remote = `https://${GIT_USER_NAME}:${GIT_PASSWORD}@github.com/${GIT_USER_NAME}/${repoName}`;
        let git = Git(DB_ROOT);
        await git.silent(false);
        await git.clone(remote);   
    }
};

const commitDb = async (repoName, message = '') => {
    let git = Git(`${DB_ROOT}/${repoName}`);
    await git.silent(false);
    await git.addConfig('user.name', GIT_USER_NAME);
    await git.addConfig('user.email', GIT_USER_EMAIL);
    await git.add('*');
    await git.commit(message);
    await git.push('origin');
};

const getNewData = (oldData = [], newData = [], keys = []) => {
    let res = [];

    for (let data of newData) {
        const index = oldData.findIndex((item) => {
            for (let key of keys) {
                if (item[key] !== data[key]) return false;
            }

            return true;
        });

        if (index === -1) {
            res.push(data);
        }
    }

    return _.uniqBy(res, keys[0]);
};

module.exports = {
    sendNotification,
    DB_ROOT,
    initDb,
    commitDb,
    getNewData,
};