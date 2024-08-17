const { faker } = require('@faker-js/faker');

const connectToDatabase = require("../database/DBConnection");
const { CATS_MONGO_COLLECTION_NAME } = require("../utils/Constants");

// const { sendSignal } = require('../sockets/ClientWebSocket');

let toBeAdded = [];

module.exports = async ({ interval, bulkSize }) => {
    const getRandomName = () => {
        return faker.person.firstName();
    }

    const getRandomAge = () => {
        return 1 + Math.floor(Math.random() * 12);
    }

    const getRandomWeight = () => {
        return faker.number.int(10) + faker.number.float({ fractionDigits: 2 });
    }

    const db = await connectToDatabase();
    let collection = await db.collection(CATS_MONGO_COLLECTION_NAME);

    while (true) {
        const cat = {
            name: getRandomName(),
            age: getRandomAge(),
            weight: getRandomWeight()
        };
        await addOneCat(cat, collection, bulkSize);

        if (interval > 0)
            await sleep(interval);
    }
}

const addOneCat = async ({ name, age, weight }, catCollection, bulkSize) => {
    toBeAdded.push({ name, age, weight });
    if (toBeAdded.length >= bulkSize) {
        await processToBeAdded(catCollection);
    }
    return;
}

const processToBeAdded = async (catCollection) => {
    const session = catCollection.client.startSession();
    session.startTransaction();

    let maximumId = (await catCollection.find({}).sort({ id: -1 }).limit(1).toArray())[0].id;
    let nextId = parseInt(maximumId) + 1;

    const newCats = toBeAdded.map(cat => ({
        id: nextId++,
        name: cat.name,
        age: cat.age,
        weight: cat.weight,
        date: new Date()
    }));

    await catCollection.insertMany(newCats);

    toBeAdded = [];

    await session.commitTransaction();
    session.endSession();

    // sendSignal();
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}