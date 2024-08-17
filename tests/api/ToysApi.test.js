const request = require('supertest');
const app = require('../../app');
const { startToyService } = require('../../service/ToyService');
const { checkManagerOrAdminTokenThenExecute, checkTokenThenExecute } = require('../../auth/TokenCheck');

jest.mock('../../auth/TokenCheck', () => ({
    checkManagerOrAdminTokenThenExecute: jest.fn((req, res, toBeDone) => {
        toBeDone({ sub: 'auth0|mockedToken' });
    }),
    checkTokenThenExecute: jest.fn((req, res, toBeDone) => {
        toBeDone({ sub: 'auth0|mockedToken' });
    })
}));

const mockToys = [
    { id: 1, name: 'Toy 1', catId: 3, weight: 5.1 },
    { id: 2, name: 'Toy 2', catId: 4, weight: 6.2 },
    { id: 3, name: 'Toy 3', catId: 2, weight: 4.8 }
];

jest.mock('../../service/ToyService', () => {
    return {
        startToyService: jest.fn(() => ({
            getAllToys: jest.fn().mockImplementation(() => mockToys),
            getToyCount: jest.fn().mockImplementation(() => mockToys.length),
            getToyById: jest.fn().mockImplementation((id) => {
                if (id <= 3)
                    return mockToys[id - 1];
                return { id: -1, name: 'error', catId: -1 };
            }),
            addToy: jest.fn().mockImplementation(() => true),
            updateToy: jest.fn().mockImplementation(() => true),
            deleteToy: jest.fn().mockImplementation(() => true)
        }))
    };
});

describe('Toy API Tests', () => {
    let mockedToyService;

    beforeEach(() => {
        mockedToyService = startToyService();
    });

    test('GET /toys/count should return the count of toys', async () => {
        const response = await request(app).get('/toys/count');
        expect(response.status).toBe(200);
        console.log('response is: ' + JSON.stringify(response));

        expect(response.body.count).toBe(mockToys.length);
    });

    test('GET /all should return all toys as provided by the server', async () => {
        const response = await request(app).get('/toys/all');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockToys);
    });

    test('GET /toys/get-by-id/:id should return that toy if exists', async () => {
        const response = await request(app).get('/toys/get-by-id/1');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockToys[0]);
    });

    test('GET /toys/get-by-id/:id should fail if no such toy', async () => {
        const response = await request(app).get('/toys/get-by-id/100');
        expect(response.status).toBe(404);
    });

    test('POST /toys/add should add a new toy', async () => {
        const newToy = { name: 'New Toy', catId: 1 };
        await request(app)
            .post('/toys/add')
            .send(newToy)
            .expect(200);
    });

    test('POST /toys/add should return 400 if invalid toy-wrong key', async () => {
        const newToy = { name: 'New Toy', catIdAAA: 1 };
        await request(app)
            .post('/toys/add')
            .send(newToy)
            .expect(400);
    });

    test('POST /toys/add should return 400 if invalid toy-empty name', async () => {
        const newToy = { name: '', catId: 1 };
        await request(app)
            .post('/toys/add')
            .send(newToy)
            .expect(400);
    });

    test('PUT toys/update/:id should return 400 if invalid toy', async () => {
        const newToy = { name: '', catId: 1 };
        await request(app)
            .put('/toys/update/1')
            .send(newToy)
            .expect(400);
    });

    test('PUT toys/update/:id should return 404 if no toy with that id', async () => {
        const newToy = { name: 'asd', catId: 1 };
        await request(app)
            .put('/toys/update/100')
            .send(newToy)
            .expect(404);
    });

    test('PUT toys/update/:id should succeed if id and toy valid', async () => {
        const newToy = { name: 'New Toy', catId: 1 };
        await request(app)
            .put('/toys/update/1')
            .send(newToy)
            .expect(200);
    });

    test('DELETE /delete/:id should return 404 if no toy with that id', async () => {
        await request(app)
            .delete('/toys/delete/100')
            .expect(404);
    });

    test('DELETE /delete/:id should succeed if id valid', async () => {
        await request(app)
            .delete('/toys/delete/1')
            .expect(200);
    });
});
