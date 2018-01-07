const express = require('express');
const path = require('path');
const debug = require('debug')("binance-frontend");
const app = express();

const MongoClient = require('mongodb').MongoClient;
// Connection URL
const url = 'mongodb://localhost:27017';
// Database Name
const dbName = 'crypto';
const maxArraySize = 200;
let db = undefined;
// Use connect method to connect to the server
MongoClient.connect(url, (err, client) => {
    debug("Connected successfully to server");
    db = client.db(dbName);
});

function getInterval(req) {
    let timeInterval = 60 * 60 * 24; // 1 day in seconds
    debug("query parameter 'interval': " + req.query.interval);
    if (req.query.interval && parseInt(req.query.interval, 10)) {
        timeInterval = req.query.interval;
    }
    debug("interval is " + timeInterval);
    return timeInterval;
}

/**
 * Returns an array that has every n'th element inside of the original array.
 */
function reduceSize(docs, maxSize) {
    if(docs.size < maxSize){
        return docs;
    }
    let reducesDocs = [];
    let n = Math.round(docs.size() / maxSize);

    let i = 0;
    for (let doc of docs) {
        if (i % n === 0) {
            reducesDocs.push(doc);
        }
        i++;
    }
    return reducesDocs;
}

/**
 * Get latest prices
 * By default 1 day of data
 */
app.get('/api/prices', (req, res) => {
    let timeInterval = getInterval(req);

    const collection = db.collection('prices');
    collection.find({date: {$gt: (new Date().getTime() / 1000) - timeInterval}}).toArray((err, docs) => {
        res.send(reduceSize(docs, maxArraySize))
    });
});

/**
 * Get balances of portfolio
 * By default 1 day of data
 */
app.get('/api/balances', (req, res) => {
    let timeInterval = getInterval(req);

    const collection = db.collection('balances');
    collection.find({date: {$gt: (new Date().getTime() / 1000) - timeInterval}}).toArray((err, docs) => {
        res.send(reduceSize(docs, maxArraySize))
    });
});

app.use('/js', express.static(path.join(__dirname, '/public/js')));
app.use('/css', express.static(path.join(__dirname, '/public/css')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.listen(8080, () => console.log('Running!'));

