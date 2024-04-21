const { MongoClient } = require("mongodb");
const mongoose = require('mongoose');

const connectionString = process.env.DB_ATLAS_URI || "";

// mongoose.connect('mongodb://127.0.0.1:27017/CatApp', { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToDatabase() {
    const client = new MongoClient(connectionString);
    let conn;
    try {
        conn = await client.connect();
    } catch (e) {
        throw e;
    }
    return conn.db("CatApp");
    // const db = mongoose.connection;
    // db.once('open', () => {
    //     console.log('Connected to MongoDB');
    // });
    // return db;
}

module.exports = connectToDatabase;
