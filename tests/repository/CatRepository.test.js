const { MongoClient } = require('mongodb');
const connectToDatabase = require('../../database/DBConnection');
const { startCatRepository } = require('../../repository/CatRepository');
const { CATS_MONGO_COLLECTION_NAME, TOYS_MONGO_COLLECTION_NAME, ERROR_CAT } = require('../../utils/Constants');
// const { it } = require('node:test');

jest.mock('../../database/DBConnection');

describe('insert', () => {
    let connection;
    let db;

    const allCats = [
        { id: 1, name: "Mary", age: 2, weight: 3 },
        { id: 2, name: "John", age: 10, weight: 7 },
        { id: 3, name: "Feli", age: 19, weight: 2.3 }
    ];

    beforeAll(async () => {
        connection = await MongoClient.connect(globalThis.__MONGO_URI__, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        db = await connection.db(globalThis.__MONGO_DB_NAME__);

        connectToDatabase.mockResolvedValue(db);

        db.collection(CATS_MONGO_COLLECTION_NAME).insertMany(allCats);
        db.collection(TOYS_MONGO_COLLECTION_NAME).insertOne({
            name: "some toy",
            catId: 1
        });
    });

    afterAll(async () => {
        await connection.close();
    });

    it('get all returns all cats in db', async () => {
        const repository = startCatRepository(false);

        const obtainedCats = await repository.getAll();

        expect(obtainedCats).toEqual(
            allCats.map(cat => ({ id: cat.id, name: cat.name, age: cat.age, weight: cat.weight }))
        );
    });

    it('get all sorted and paginated ascending returns all sorted ascending and paginated', async () => {
        const repository = startCatRepository(false);

        const obtainedCats = await repository.getAllSortedPaginated(1, 1, 2);

        expect(obtainedCats).toEqual(
            [
                { id: 3, name: "Feli", age: 19, weight: 2.3 },
                { id: 2, name: "John", age: 10, weight: 7 }
            ]
        );
    });

    it('get all sorted and paginated descending returns all sorted descending and paginated', async () => {
        const repository = startCatRepository(false);

        const obtainedCats = await repository.getAllSortedPaginated(-1, 1, 2);

        expect(obtainedCats).toEqual(
            [
                { id: 1, name: "Mary", age: 2, weight: 3 },
                { id: 2, name: "John", age: 10, weight: 7 }
            ]
        );
    });

    it('get count returns the number of cats', async () => {
        const repository = startCatRepository(false);

        const count = await repository.getCount();

        expect(count).toEqual(allCats.length);
    });

    it('get by id returns that cat if exists', async () => {
        const repository = startCatRepository(false);

        const cat = await repository.getById(2);

        expect(cat.name).toEqual("John");
    });

    it('get by id returns error cat if no cat with that id', async () => {
        const repository = startCatRepository(false);

        const cat = await repository.getById(100);

        expect(cat).toEqual(ERROR_CAT);
    });

    it('add adds cat', async () => {
        const repository = startCatRepository(false);

        await repository.add({ name: "just added", age: 1, weight: 1 });

        const catsNow = await repository.getAll();

        expect(catsNow).toContainEqual({ id: 4, name: "just added", age: 1, weight: 1 });
    });

    it('delete by id returns false if cat has toys', async () => {
        const repository = startCatRepository(false);

        const deleteReturnValue = await repository.deleteById(1);

        expect(deleteReturnValue).toEqual(false);
    });

    it('delete deletes cat', async () => {
        const repository = startCatRepository(false);

        const deleteReturnValue = await repository.deleteById(2);

        expect(deleteReturnValue).toEqual(true);

        const catsNow = await repository.getAll();
        expect(catsNow).not.toContainEqual({ id: 2, name: "John", age: 10, weight: 7 });
    });

    it('update updates cat', async () => {
        const repository = startCatRepository(false);
        let newCat = { name: "newcat", age: 5, weight: 7 };

        await repository.update(1, newCat);

        const catNow = await repository.getById(1);
        expect(catNow.name).toEqual("newcat");
    });

    it('toys per cat returns the aggregation', async () => {
        const repository = startCatRepository(false);

        const catAndCount = await repository.toysPerCat(10);

        expect(catAndCount).toEqual([
            { cat: { id: 1, name: "newcat", age: 5, weight: 7 }, theNumber: 1 }
        ]);
    });

    it('get age distribution returns the distribution', async () => {
        const repository = startCatRepository(false);

        const ageAndCount = await repository.getAgeDistribution();

        expect(ageAndCount).toContainEqual({ age: 1, count: 1 });
        expect(ageAndCount).toContainEqual({ age: 5, count: 1 });
        expect(ageAndCount).toContainEqual({ age: 19, count: 1 });
    });
});