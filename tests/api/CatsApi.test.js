const request = require('supertest');
const app = require('../../app');
const { startCatService } = require('../../service/CatService');
const { checkManagerOrAdminTokenThenExecute, checkTokenThenExecute } = require('../../auth/TokenCheck');

jest.mock('../../auth/TokenCheck', () => ({
    checkManagerOrAdminTokenThenExecute: jest.fn((req, res, toBeDone) => {
        toBeDone({ sub: 'auth0|mockedToken' });
    }),
    checkTokenThenExecute: jest.fn((req, res, toBeDone) => {
        toBeDone({ sub: 'auth0|mockedToken' });
    })
}));

const mockCats = [
    { id: 1, name: 'Cat 1', age: 3, weight: 5 },
    { id: 2, name: 'Cat 2', age: 4, weight: 6 },
    { id: 3, name: 'Cat 3', age: 2, weight: 4 },
    { id: 4, name: 'Cat 4', age: 5, weight: 7 },
    { id: 5, name: 'Cat 5', age: 6, weight: 8 }
];

jest.mock('../../service/CatService', () => {
    return {
        startCatService: jest.fn(() => ({
            getAllCatsSortedAndPaginated: jest.fn().mockImplementation(() => mockCats),
            getCatCount: jest.fn().mockImplementation(() => mockCats.length),
            getCatById: jest.fn().mockImplementation((id) => {
                if (id <= 5)
                    return mockCats[id - 1];
                return { id: -1, name: 'error', age: -1, weight: -1 };
            }),
            addCat: jest.fn().mockImplementation(() => true),
            updateCat: jest.fn().mockImplementation(() => true),
            deleteCat: jest.fn().mockImplementation(() => true),
            getToysPerCat: jest.fn(),
            getUsersFavoriteBreed: jest.fn().mockImplementation(() => "orange"),
            getCatAgeDistribution: jest.fn()
        }))
    };
});


describe('Cat API Tests', () => {
    let mockedCatService;

    beforeEach(() => {
        mockedCatService = startCatService();
    });

    test('GET /cats/count should return the count of cats', async () => {
        const response = await request(app).get('/cats/count');
        expect(response.status).toBe(200);
        console.log('response is: ' + JSON.stringify(response));

        expect(response.body.count).toBe(mockCats.length);
    });

    test('GET / should return all cats sorted and paginated as provided by the server', async () => {
        const response = await request(app).get('/cats?sortByNameDirection=asc&pageNumber=2');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCats);
    });

    test('GET /cats/get-by-id/:id should return that cat if exists', async () => {
        const response = await request(app).get('/cats/get-by-id/1');
        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockCats[0]);
    });

    test('GET /cats/get-by-id/:id should fail if no such cat', async () => {
        const response = await request(app).get('/cats/get-by-id/100');
        expect(response.status).toBe(404);
    });

    test('POST /cats fails if no manager/admin token', async () => {
        checkManagerOrAdminTokenThenExecute.mockImplementationOnce((req, res, toBeDone) => {
            return res.status(401).json({ error: 'Authorization header is missing' });
        });

        const newCat = { name: 'New Cat', age: 2, weight: 4 };
        await request(app)
            .post('/cats')
            .send(newCat)
            .expect(401);
    });

    test('POST /cats should add a new cat', async () => {
        const newCat = { name: 'New Cat', age: 2, weight: 4 };
        await request(app)
            .post('/cats')
            .set('Authorization', 'Bearer mockToken')
            .send(newCat)
            .expect(200);
    });

    test('POST /cats should return 400 if invalid cat-wrong key', async () => {
        const newCat = { name: 'New Cat', age: 2, weightBADNAME: 4 };
        await request(app)
            .post('/cats')
            .set('Authorization', 'Bearer mockToken')
            .send(newCat)
            .expect(400);
    });

    test('POST /cats should return 400 if invalid cat-too many keys', async () => {
        const newCat = { name: 'New Cat', age: 2, weight: 4, asdasd: 3 };
        await request(app)
            .post('/cats')
            .set('Authorization', 'Bearer mockToken')
            .send(newCat)
            .expect(400);
    });

    test('POST /cats should return 400 if invalid cat-empty name', async () => {
        const newCat = { name: '', age: 2, weight: 4 };
        await request(app)
            .post('/cats')
            .set('Authorization', 'Bearer mockToken')
            .send(newCat)
            .expect(400);
    });

    test('POST /cats should return 400 if invalid cat-age not int', async () => {
        const newCat = { name: 'Nume', age: "ad", weight: 4 };
        await request(app)
            .post('/cats')
            .set('Authorization', 'Bearer mockToken')
            .send(newCat)
            .expect(400);
    });

    test('PUT /:id fails if no manager/admin token', async () => {
        checkManagerOrAdminTokenThenExecute.mockImplementationOnce((req, res, toBeDone) => {
            return res.status(401).json({ error: 'Authorization header is missing' });
        });

        const newCat = { name: 'New Cat', age: 2, weight: 4 };
        await request(app)
            .put('/cats/1')
            .send(newCat)
            .expect(401);
    });

    test('PUT /:id should return 400 if invalid cat', async () => {
        const newCat = { name: 'New Cat', age: 2, weightBADNAME: 4 };
        await request(app)
            .put('/cats/1')
            .set('Authorization', 'Bearer mockToken')
            .send(newCat)
            .expect(400);
    });

    test('PUT /:id should return 404 if no cat with that id', async () => {
        const newCat = { name: 'New Cat', age: 2, weight: 4 };
        await request(app)
            .put('/cats/100')
            .set('Authorization', 'Bearer mockToken')
            .send(newCat)
            .expect(404);
    });

    test('PUT /:id should succeed if cat valid and token valid', async () => {
        const newCat = { name: 'New Cat', age: 2, weight: 4 };
        await request(app)
            .put('/cats/1')
            .set('Authorization', 'Bearer mockToken')
            .send(newCat)
            .expect(200);
    });

    test('DELETE /:id fails if no manager/admin token', async () => {
        checkManagerOrAdminTokenThenExecute.mockImplementationOnce((req, res, toBeDone) => {
            return res.status(401).json({ error: 'Authorization header is missing' });
        });

        const newCat = { name: 'New Cat', age: 2, weight: 4 };
        await request(app)
            .delete('/cats/1')
            .expect(401);
    });

    test('DELETE /:id should return 404 if no cat with that id', async () => {
        await request(app)
            .delete('/cats/100')
            .set('Authorization', 'Bearer mockToken')
            .expect(404);
    });

    test('DELETE /:id should succeed if cat valid and token valid', async () => {
        await request(app)
            .delete('/cats/1')
            .set('Authorization', 'Bearer mockToken')
            .expect(200);
    });

    test("GET users-favorite-breed should fail if no token", async () => {
        checkTokenThenExecute.mockImplementationOnce((req, res, toBeDone) => {
            return res.status(401).json({ error: 'Authorization header is missing' });
        });

        await request(app)
            .get("/cats/users-favorite-breed")
            .expect(401);
    });

    test("GET users-favorite-breed should return the fav breed provided by service if token valid", async () => {
        const result = await request(app)
            .get("/cats/users-favorite-breed")
            .expect(200);
        expect(result.body).toEqual("orange");
    });

    
});
