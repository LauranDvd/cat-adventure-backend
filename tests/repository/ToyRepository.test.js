const { MongoClient } = require('mongodb');
const connectToDatabase = require('../../database/DBConnection');
const { startToyRepository, errorToy } = require('../../repository/ToyRepository');

jest.mock('../../database/DBConnection');

describe('ToyRepository', () => {
    let connection;
    let db;

    const allToys = [
        { id: 1, name: "Toy1", catId: 1 },
        { id: 2, name: "Toy2", catId: 2 },
        { id: 3, name: "Toy3", catId: 3 }
    ];

    beforeAll(async () => {
        connection = await MongoClient.connect(globalThis.__MONGO_URI__, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        db = await connection.db(globalThis.__MONGO_DB_NAME__);

        connectToDatabase.mockResolvedValue(db);

        db.collection("Toys").insertMany(allToys);
    });

    afterAll(async () => {
        await connection.close();
    });

    it('getAll returns all toys in db', async () => {
        const repository = startToyRepository();

        const obtainedToys = await repository.getAll();

        expect(obtainedToys).toEqual(allToys.map(toy => ({ catId: toy.catId, id: toy.id, name: toy.name })));
    });

    it('getCount returns the number of toys', async () => {
        const repository = startToyRepository();

        const count = await repository.getCount();

        expect(count).toEqual(allToys.length);
    });

    it('getById returns that toy if exists', async () => {
        const repository = startToyRepository();

        const toy = await repository.getById(2);

        expect(toy.name).toEqual("Toy2");
    });

    it('getById returns error toy if no toy with that id', async () => {
        const repository = startToyRepository();

        const toy = await repository.getById(100);

        expect(toy).toEqual(errorToy);
    });

    it('add adds toy', async () => {
        const repository = startToyRepository();

        await repository.add({ name: "New Toy", catId: 4 });

        const toysNow = await repository.getAll();

        expect(toysNow).toContainEqual({ id: 4, name: "New Toy", catId: 4 });
    });

    it('deleteById deletes toy', async () => {
        const repository = startToyRepository();

        await repository.deleteById(1);

        const toysNow = await repository.getAll();

        expect(toysNow).not.toContainEqual({ id: 1, name: "Toy1", catId: 1 });
    });

    it('update updates toy', async () => {
        const repository = startToyRepository();

        let newToy = { name: "Updated Toy", catId: 3 };

        await repository.update(2, newToy);

        const toyNow = await repository.getById(2);
        expect(toyNow.name).toEqual("Updated Toy");
    });
});
