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
    let allCats = [];

    const getAll = () => allCats;

    const getCount = () => allCats.length;

    const getById = (id) => {
        const cat = allCats.find(cat => cat.id === id);
        if (cat !== undefined)
            return cat;
        return errorCat;
    }

    const add = async ({ name, age, weight }) => {
        let maximumId = 0;
        allCats.forEach(cat => {
            if (cat.id > maximumId)
                maximumId = cat.id;
        });

        let newCat = { id: maximumId + 1, name: name, age: age, weight: weight };

        allCats = [...allCats, newCat];


        const db = await connectToDatabase();
        let collection = await db.collection("Cats");
        let catForDB = JSON.parse(JSON.stringify({ name, age, weight }));
        catForDB.date = new Date();
        let result = await collection.insertOne(catForDB);




        sendSignal();
    }

    const deleteById = (id) => {
        allCats = allCats.filter(cat => cat.id !== id);
    }

    const update = (id, newCat) => {
        allCats = allCats.map(currentCat => {
            if (currentCat.id === id)
                return newCat;
            return currentCat;
        });
    }

    addRandomCats(add, 12);
    // for (let catWithoutId of hardcodedCatsWithoutId)
    //     add(catWithoutId);

    setInterval(addRandomCats, 10000, add, 1);

    return { getAll, getCount, getById, add, deleteById, update };
}

module.exports = { startCatRepository, errorCat };