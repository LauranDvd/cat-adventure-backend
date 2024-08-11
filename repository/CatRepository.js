const { sendSignal } = require('../sockets/ClientWebSocket');
const path = require('path');
const Piscina = require('piscina');

const connectToDatabase = require("../database/DBConnection");

const errorCat = { id: -1, name: "Error", age: -1, weight: -1, cuteness: -1, ownerId: -1 };

const max = (a, b) => {
    return a >= b ? a : b;
}

const addRandomCatsOnSeparateThread = (interval, bulkSize) => {
    const piscina = new Piscina({
        filename: path.resolve(__dirname, '../workers/AddRandomCatsWorker.js')
    });
    console.log('created piscina');

    piscina.run({ interval: interval, bulkSize: bulkSize });
    setInterval(sendSignal, max(100, interval * bulkSize));
    console.log('ran piscina');
}

const addRandomToysOnSeparateThread = (interval, bulkSize) => {
    const piscina = new Piscina({
        filename: path.resolve(__dirname, '../workers/AddRandomToysWorker.js')
    });
    console.log('created piscina');

    piscina.run({ interval: interval, bulkSize: bulkSize });
    console.log('ran piscina');
}

const startCatRepository = (generateCatsInBackground = true) => {
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

    const getAllSortedPaginated = async (sortByNameDirection, firstEntryNumber, lastEntryNumber) => {
        console.log('repo: first, last=' + firstEntryNumber + ", " + lastEntryNumber);

        const db = await connectToDatabase();
        let collection = await db.collection("Cats");
        let results = await collection.find({})
            .sort({ name: sortByNameDirection })
            .skip(firstEntryNumber - 1)
            .limit(lastEntryNumber - firstEntryNumber + 1)
            .toArray();
        results = results.map(cat => ({
            id: cat.id, name: cat.name, age: cat.age, weight: cat.weight, cuteness: cat.cuteness,
            ownerId: cat.ownerId
        }));
        return results;
    }

    // const getAllToys = async () => {
    //     const db = await connectToDatabase();
    //     let collection = await db.collection("Toys");
    //     let results = await collection.find({})
    //         .toArray();
    //     results = results.map(toy => ({ id: toy.id, catId: toy.catId, name: toy.name }));
    //     return results;
    // };

    const getCount = async () => {
        const db = await connectToDatabase();
        let collection = await db.collection("Cats");
        return collection.count();
    }

    const getById = async (id) => {
        const db = await connectToDatabase();
        let collection = await db.collection("Cats");
        let results = await collection.find({ id: id })
            .toArray();

        if (results.length === 0) {
            return errorCat;
        }

        results = results.map(cat => (
            {
                id: cat.id, name: cat.name, age: cat.age, weight: cat.weight, cuteness: cat.cuteness, ownerId: cat.ownerId,
                avatarUrl: cat.avatarUrl
            }
        ));
        return results[0];
    }

    const add = async ({ name, age, weight, cuteness, ownerId }) => {
        const db = await connectToDatabase();
        let collection = await db.collection("Cats");

        let maximumId = (await collection.find({}).sort({ id: -1 }).limit(1).toArray())[0].id;
        console.log('maximum id in Cats: ' + JSON.stringify(maximumId));

        let newCat = { id: maximumId + 1, name: name, age: age, weight: weight, cuteness: cuteness, ownerId: ownerId };

        newCat.date = new Date();
        await collection.insertOne(newCat);

        sendSignal();
    }

    const deleteById = async (id) => {
        const db = await connectToDatabase();

        if (await db.collection("Toys").findOne({ catId: id }) !== null) {
            console.log('didn\'t delete cat because it has toys');
            return false;
        }

        const query = { id: id };
        const collection = db.collection("Cats");
        await collection.deleteOne(query);

        return true;
    }

    const update = async (id, newCat) => {
        console.log(`repo will update and set this cat: ${JSON.stringify(newCat)}`);

        const db = await connectToDatabase();
        const query = { id: id };
        const updates = { $set: newCat };
        let collection = await db.collection("Cats");
        await collection.updateOne(query, updates);
    }

    const buy = async (catId, userId) => {
        const db = await connectToDatabase();

        const userCollection = db.collection("AppUsers");
        const user = await userCollection.findOne({ id: userId });

        if (!user || !user.money || user.money < 10) {
            console.log('User does not have enough money or does not exist.');
            return false;
        }

        const newMoneyAmount = user.money - 10;
        await userCollection.updateOne({ id: userId }, { $set: { money: newMoneyAmount } });

        const catCollection = db.collection("Cats");
        await catCollection.updateOne({ id: catId }, { $set: { ownerId: userId } });

        return true;
    }

    const toysPerCat = async (count) => {
        count = parseInt(count);

        const db = await connectToDatabase();

        const catToysAggregation = [
            {
                $group: {
                    _id: "$catId",
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "Cats",
                    localField: "_id",
                    foreignField: "id",
                    as: "cat"
                }
            },
            {
                $unwind: "$cat"
            },
            {
                $project: {
                    _id: 0,
                    cat: {
                        id: "$cat.id",
                        name: "$cat.name",
                        age: "$cat.age",
                        weight: "$cat.weight"
                    },
                    theNumber: "$count"
                }
            },
            {
                $limit: count
            }
        ];

        const results = await db.collection("Toys").aggregate(catToysAggregation).toArray();

        return results;
    }

    const getUsersFavoriteBreedById = async (userId) => {
        const db = await connectToDatabase();
        const user = (await db.collection("AppUsers").find({ id: userId }).toArray())[0];
        if (user === undefined)
            return "";
        const breed = user.favoriteBreed;
        return breed;
    }

    const getUsersCatsById = async (userId) => {
        const db = await connectToDatabase();
        let collection = await db.collection("Cats");
        let results = await collection.find({ ownerId: userId }).toArray();

        results = results.map(cat => ({
            id: cat.id,
            name: cat.name,
            age: cat.age,
            weight: cat.weight,
            cuteness: cat.cuteness,
            ownerId: cat.ownerId,
            avatarUrl: cat.avatarUrl
        }));

        return results;
    }

    const getAgeDistribution = async () => {
        const db = await connectToDatabase();

        const ageDistributionAggregation = [
            {
                $group: {
                    _id: "$age",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    age: "$_id",
                    count: 1
                }
            }
        ];

        const results = await db.collection("Cats").aggregate(ageDistributionAggregation).toArray();

        return results;
    }

    const setTheAvatar = async (catId, avatarParameters) => {
        avatarParameters = JSON.parse(avatarParameters);

        console.log(`repo setavatar params: ${JSON.stringify(avatarParameters)}`);

        const avatarUrl = `https://cat-avatars.vercel.app/api/cat?parts=\
${avatarParameters.body},\
${avatarParameters.fur},\
${avatarParameters.eyes},\
${avatarParameters.mouth},\
${avatarParameters.accessory}`;
        console.log(`repo avatarurl: ${avatarUrl}`);

        const db = await connectToDatabase();
        const findQuery = { id: catId };
        const updates = { $set: { avatarUrl: avatarUrl } };
        const collection = await db.collection("Cats");
        await collection.updateOne(findQuery, updates);

        return true;
    }

    const getCutestCatOfUser = async (userId) => {
        const db = await connectToDatabase();
        const collection = db.collection("Cats");

        const aggregationPipeline = [
            { $match: { ownerId: userId } },
            { $sort: { cuteness: -1 } },
            { $limit: 1 }
        ];

        const result = await collection.aggregate(aggregationPipeline).toArray();

        return result.length > 0 ? result[0] : errorCat;
    }

    // addRandomCatsOnSeparateThread(0, 1000);
    if (generateCatsInBackground)
        addRandomCatsOnSeparateThread(5000, 1);
    // addRandomToysOnSeparateThread(0, 10000);
    // setInterval(addRandomToys, 1000, addToy, 1);

    return {
        getAll, getCount, getById, add, deleteById, update, toysPerCat, getUsersFavoriteBreedById, getAllSortedPaginated,
        getAgeDistribution, getUsersCatsById, buy, setTheAvatar, getCutestCatOfUser
    };
}

module.exports = { startCatRepository, errorCat };