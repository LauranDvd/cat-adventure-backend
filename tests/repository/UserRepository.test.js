const { MongoClient } = require('mongodb');
const connectToDatabase = require('../../database/DBConnection');
const { startUserRepository, errorUser } = require('../../repository/UserRepository');

jest.mock('../../database/DBConnection');

describe('UserRepository', () => {
    let connection;
    let db;

    const allUsers = [
        { id: 1, favoriteBreed: "Persian", userRole: 1 },
        { id: 2, favoriteBreed: "Siamese", userRole: 2 },
        { id: 3, favoriteBreed: "Maine Coon", userRole: 1 }
    ];

    const allRoles = [
        { roleId: 1, roleName: "Regular User" },
        { roleId: 2, roleName: "Manager" },
        { roleId: 3, roleName: "Admin" }
    ];

    beforeAll(async () => {
        connection = await MongoClient.connect(globalThis.__MONGO_URI__, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        db = await connection.db(globalThis.__MONGO_DB_NAME__);

        connectToDatabase.mockResolvedValue(db);

        await db.collection("AppUsers").insertMany(allUsers);
        await db.collection("UserRoles").insertMany(allRoles);
    });

    afterAll(async () => {
        await connection.close();
    });

    const repository = startUserRepository();

    it('getById returns that user if exists', async () => {
        const user = await repository.getById(2);

        expect(user.favoriteBreed).toEqual("Siamese");
    });

    it('getById returns error user if no user with that id', async () => {
        const user = await repository.getById(100);

        expect(user).toEqual(errorUser);
    });

    // THESE FUNCTIONS SEND REQUESTS TO AUTH0
    // it('getAll returns all users in db', async () => {
    //     const obtainedUsers = await repository.getAll();

    //     expect(obtainedUsers).toEqual(allUsers);
    // });

    // it('add adds user', async () => {
    //     await repository.add({ name: "John Doe", email: "john@example.com", password: "password", roleName: "User" });

    //     const usersNow = await repository.getAll();

    //     expect(usersNow.some(user => user.id === 4)).toBeTruthy();
    // });

    // it('deleteById deletes user', async () => {
    //     await repository.deleteById(3);

    //     const usersNow = await repository.getAll();

    //     expect(usersNow.some(user => user.id === 3)).toBeFalsy();
    // });

    it('updateRole updates user role', async () => {
        await repository.updateRole(1, "Manager");

        const userNow = await repository.getById(1);
        expect(userNow.userRole).toEqual(2);
    });
});
