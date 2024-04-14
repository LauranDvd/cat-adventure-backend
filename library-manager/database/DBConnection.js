const { MongoClient } = require("mongodb");

const connectionString = process.env.DB_ATLAS_URI || "";

async function connectToDatabase() {
    const client = new MongoClient(connectionString);
    let conn;
    try {
        conn = await client.connect();
        console.log("Connected to MongoDB Atlas");
    } catch (e) {
        console.error("Error connecting to MongoDB: ", e);
        throw e;
    }
    return conn.db("CatApp");
}

module.exports = connectToDatabase;
