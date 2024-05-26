const { MongoClient } = require("mongodb");
const mongoose = require('mongoose');

const connectionString = process.env.DB_ATLAS_URI || "";

// mongoose.connect('mongodb://127.0.0.1:27017/CatApp', { useNewUrlParser: true, useUnifiedTopology: true });

let dbInstance = null; // singleton

async function connectToDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    const client = new MongoClient(connectionString);
    try {
        await client.connect();
        dbInstance = client.db("CatApp");
        return dbInstance;
    } catch (e) {
        throw e;
    }
    // const db = mongoose.connection;
    // db.once('open', () => {
    //     console.log('Connected to MongoDB');
    // });
    // return db;
}

module.exports = connectToDatabase;
