const { faker } = require('@faker-js/faker');
const connectToDatabase = require("../database/DBConnection");

const getRandomName = () => {
    return faker.vehicle.bicycle();
}

const getRandomCatId = () => {
    return 1 + Math.floor(Math.random() * 12);
}

const errorToy = { id: -1, name: "Error", catId: -1 };

const addRandomToys = (addFunction, numberOfToys) => {
    for (let i = 0; i < numberOfToys; i++)
        addFunction({ name: getRandomName(), catId: getRandomCatId() });
}

const startToyRepository = () => {
    const getAll = async () => {
        const db = await connectToDatabase();
        let collection = await db.collection("Toys");
        let results = await collection.find({})
            .toArray();
        results = results.map(toy => ({ id: toy.id, name: toy.name, catId: toy.catId }));
        return results;
    };

    const getCount = async () => {
        const db = await connectToDatabase();
        let collection = await db.collection("Toys");
        return collection.count();
    }

    const getById = async (id) => {
        const db = await connectToDatabase();
        let collection = await db.collection("Toys");
        let results = await collection.find({ id: id })
            .toArray();

        if (results.length === 0) {
            return errorToy;
        }

        results = results.map(toy => ({ id: toy.id, name: toy.name, catId: toy.catId }));
        return results[0];
    }

    const add = async ({ name, catId }) => {
        const db = await connectToDatabase();
        let collection = await db.collection("Toys");

        let maximumId = (await collection.find({}).sort({ id: -1 }).limit(1).toArray())[0].id;
        console.log('maximum id in Toys: ' + JSON.stringify(maximumId));

        let newToy = { id: maximumId + 1, name: name, catId: catId };

        newToy.date = new Date();
        await collection.insertOne(newToy);
    }

    const deleteById = async (id) => {
        const db = await connectToDatabase();
        const query = { id: id };
        const collection = db.collection("Toys");
        await collection.deleteOne(query);
    }

    const update = async (id, newToy) => {
        const db = await connectToDatabase();
        const query = { id: id };
        const updates = { $set: newToy };
        let collection = await db.collection("Toys");
        await collection.updateOne(query, updates);
    }

    return { getAll, getCount, getById, add, deleteById, update };
}

module.exports = { startToyRepository, errorToy };