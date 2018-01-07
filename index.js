const express = require('express');
const path = require('path');
const app = express();

const MongoClient = require('mongodb').MongoClient;
// Connection URL
const url = 'mongodb://localhost:27017';
// Database Name
const dbName = 'crypto';
let db = undefined;
// Use connect method to connect to the server
MongoClient.connect(url, (err, client) => {
    console.log("Connected successfully to server");
    db = client.db(dbName);
});


app.get('/api/prices', (req, res) => {
    // Get the documents collection
    const collection = db.collection('prices');
    // Find some documents
    collection.find().toArray((err, docs) => {
        res.send(docs)
    });
});


app.get('/api/balances', (req, res) => {
    // Get the documents collection
    const collection = db.collection('balances');
    // Find some documents
    collection.find().toArray( (err, docs) => {
        res.send(docs)
    });
});

app.use('/js', express.static(path.join(__dirname, '/public/js')));
app.use('/css', express.static(path.join(__dirname, '/public/css')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.listen(8080, () => console.log('Running!'));

