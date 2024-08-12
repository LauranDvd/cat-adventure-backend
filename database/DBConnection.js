const { MongoClient } = require("mongodb");
const mongoose = require('mongoose');

const connectionString = process.env.DB_ATLAS_URI || "";

let dbInstance = null; // singleton

async function connectToDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    console.log('will connect to mongo with connectionstring=' + JSON.stringify(connectionString));
    const client = new MongoClient(connectionString);
    try {
        await client.connect();
        dbInstance = client.db("CatApp");
        return dbInstance;
    } catch (e) {
        throw e;
    }
}

module.exports = connectToDatabase;
