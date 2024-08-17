const { faker } = require('@faker-js/faker');

const connectToDatabase = require("../database/DBConnection");
const { CATS_MONGO_COLLECTION_NAME, TOYS_MONGO_COLLECTION_NAME } = require('../utils/Constants');

let toBeAdded = [];

const getRandomCatIds = async (numberOfIds, catCollection) => {
    const randomCatIds = await catCollection.aggregate([{ $sample: { size: numberOfIds } }, {$project: {_id: 0, id: 1}}]).toArray();
    return randomCatIds;
}

module.exports = async ({ interval, bulkSize }) => {
    const db = await connectToDatabase();
    let toyCollection = await db.collection(TOYS_MONGO_COLLECTION_NAME);
    let catCollection = await db.collection(CATS_MONGO_COLLECTION_NAME);

    const getRandomToyName = () => {
        return faker.vehicle.bicycle();
    }

    while (true) {
        const toy = {
            name: getRandomToyName()
        };

        await addOneToy(toy, toyCollection, catCollection, bulkSize);

        if (interval > 0)
            await sleep(interval);
    }
}

const addOneToy = async ({ name }, toyCollection, catCollection, bulkSize) => {
    toBeAdded.push({ name });
    if (toBeAdded.length >= bulkSize) {
        await processToBeAdded(toyCollection, catCollection);
    }
    return;
}

const processToBeAdded = async (toyCollection, catCollection) => {
    const session = toyCollection.client.startSession();
    session.startTransaction();

    let maximumToyId = (await toyCollection.find({}).sort({ id: -1 }).limit(1).toArray())[0].id;
    let nextId = parseInt(maximumToyId) + 1;
    let catIds = await getRandomCatIds(toBeAdded.length, catCollection);
    let catIdsIndex = 0;

    const newToys = toBeAdded.map(toy => ({
        id: nextId++,
        name: toy.name,
        catId: catIds[catIdsIndex++].id,
        date: new Date()
    }));

    await toyCollection.insertMany(newToys);

    toBeAdded = [];

    await session.commitTransaction();
    session.endSession();
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
