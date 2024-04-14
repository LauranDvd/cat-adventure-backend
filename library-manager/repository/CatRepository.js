const { faker } = require('@faker-js/faker');
const { sendSignal } = require('../sockets/ClientWebSocket');

// const hardcodedCatsWithoutId = [
//     { name: "Sofia", age: 2, weight: 2.3 },
//     { name: "Raymond", age: 5, weight: 3.8 },
//     { name: "David", age: 3, weight: 2.3 },
//     { name: "Mihai", age: 4, weight: 1.8 },
//     { name: "Ion", age: 1, weight: 2.3 },
//     { name: "Ionel", age: 1, weight: 1.8 },
//     { name: "Felicia", age: 5, weight: 5.3 },
//     { name: "Cami", age: 6, weight: 3.3 },
//     { name: "Popescu", age: 3, weight: 2.4 },
//     { name: "Georgescu", age: 3, weight: 6.3 },
//     { name: "Xyz", age: 12, weight: 2.1 },
//     { name: "Alina", age: 10, weight: 4.9 },
// ];

const connectToDatabase = require("../database/DBConnection");

const getRandomName = () => {
    return faker.person.firstName();
}

const getRandomAge = () => {
    // faker always returns 1, 5, or 9

    // return 1 + faker.number.int() % 12;  
    return 1 + Math.floor(Math.random() * 12);
}

const getRandomWeight = () => {
    return faker.number.int() % 10 + faker.number.float({ fractionDigits: 2 });
}

const errorCat = { id: -1, name: "Error", age: -1, weight: -1 };

const addRandomCats = (addFunction, numberOfCats) => {
    for (let i = 0; i < numberOfCats; i++)
        addFunction({ name: getRandomName(), age: getRandomAge(), weight: getRandomWeight() });
}

const startCatRepository = () => {
    const getAll = async () => {
        // console.log('entered getall...');
        const db = await connectToDatabase();
        let collection = await db.collection("Cats");
        // console.log('got collection...');
        let results = await collection.find({})
            .toArray();
        results = results.map(cat => ({ id: cat.id, name: cat.name, age: cat.age, weight: cat.weight }));
        // console.log('results=' + JSON.stringify(results));
        return results;
    };

    const getCount = async () => {
        const allCats = await getAll();
        return allCats.length;
    }

    const getById = async (id) => {
        const allCats = await getAll();
        const cat = allCats.find(cat => cat.id === id);
        console.log('cat: ' + JSON.stringify(cat));
        if (cat !== undefined)
            return cat;
        return errorCat;
    }

    const add = async ({ name, age, weight }) => {
        let maximumId = 0;
        const allCats = await getAll();
        allCats.forEach(cat => {
            if (cat.id > maximumId)
                maximumId = cat.id;
        });

        let newCat = { id: maximumId + 1, name: name, age: age, weight: weight };

        const db = await connectToDatabase();
        let collection = await db.collection("Cats");
        newCat.date = new Date();
        await collection.insertOne(newCat);

        sendSignal();
    }

    const deleteById = async (id) => {
        const db = await connectToDatabase();
        const query = { id: id };
        const collection = db.collection("Cats");
        await collection.deleteOne(query);

        // allCats = allCats.filter(cat => cat.id !== id);
    }

    const update = async (id, newCat) => {
        const db = await connectToDatabase();
        const query = { id: id };
        const updates = { $set: newCat };
        let collection = await db.collection("Cats");
        await collection.updateOne(query, updates);

        // allCats = allCats.map(currentCat => {
        //     if (currentCat.id === id)
        //         return newCat;
        //     return currentCat;
        // });
    }

    setInterval(addRandomCats, 10000, add, 1);

    return { getAll, getCount, getById, add, deleteById, update };
}

module.exports = { startCatRepository, errorCat };