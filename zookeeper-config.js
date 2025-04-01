const zookeeper = require('node-zookeeper-client');


const client = zookeeper.createClient('127.0.0.1:2181');
client.connect();

const configPath = '/config/db_url';


function ensureZNodeExists(path, defaultValue = '') {
    client.exists(path, (error, stat) => {
        if (error) {
            console.error(`Error checking ${path}:`, error);
            return;
        }
        if (!stat) {
            console.log(`${path} does not exist. Creating it...`);
            client.create(path, Buffer.from(defaultValue), (err) => {
                if (err && err.code !== zookeeper.Exception.NODE_EXISTS) {
                    console.error(`Error creating ${path}:`, err);
                } else {
                    console.log(`Created ${path} with default value: "${defaultValue}"`);
                }
            });
        }
    });
}

function readConfig(key, defaultValue = '') {
    ensureZNodeExists(path, defaultValue);
    watchConfig(key);
}

function watchConfig(key) {
    const path = `${configPath}/${key}`;

    client.getData(path, (event) => {
        console.log(`Config change detected for ${key}:`, event);
        watchConfig(key); 
    }, (error, data) => {
        if (error) {
            console.error(`Error reading ${key}:`, error);
            return;
        }
        console.log(`Config ${key}: ${data ? data.toString() : 'null'}`);
    });
}

client.once('connected', () => {
    console.log('Connected to ZooKeeper');


    ensureZNodeExists(configPath);


    readConfig('db_url', '127.0.0.1');
});


function updateConfig(key, value) {
    const path = `${configPath}/${key}`;
    client.setData(path, Buffer.from(value), (error) => {
        if (error) {
            console.error(`Error updating ${key}:`, error);
        } else {
            console.log(`Updated ${key} to ${value}`);
        }
    });
}

setInterval(() => {
    updateConfig('db_url', `192.168.0.${(Math.random())}`);
}, 5000);