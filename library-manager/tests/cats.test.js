const request = require('supertest');
const app = require('../app');

test('/all', async () => {
    const response = await request(app).get('/cats/all?sortByNameDirection=asc');
    expect(response.status).toBe(200);

    expect(response.body.length).toEqual(12);

    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('name');
    expect(response.body[0]).toHaveProperty('age');
    expect(response.body[0]).toHaveProperty('weight');
});

test('/count', async () => {
    const response = await request(app).get('/cats/count');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ count: 12 });
});

test('/get-by-id/2', async () => {
    const response = await request(app).get('/cats/get-by-id/2');
    expect(response.status).toBe(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('name');
    expect(response.body).toHaveProperty('age');
    expect(response.body).toHaveProperty('weight');
});

test('cat added with /add appears in /all', async () => {
    const toAdd = { name: 'TestCat', age: 20, weight: 3.2 };
    await request(app)
        .post('/cats/add')
        .send(toAdd)
        .expect(200);

    const response = await request(app).get('/cats/all?sortByNameDirection=desc').expect(200);
    expect(response.body).toEqual(expect.arrayContaining([{ id: 13, name: 'TestCat', age: 20, weight: 3.2 }]));
});

test('update with /update appears in /all', async () => {
    const newCat = { name: 'TestCat', age: 20, weight: 3.2 };
    await request(app)
        .put('/cats/update/4')
        .send(newCat)
        .expect(200);

    const response = await request(app).get('/cats/all?sortByNameDirection=desc').expect(200);
    expect(response.body).toEqual(expect.arrayContaining([{ id: 4, name: 'TestCat', age: 20, weight: 3.2 }]));
});

test('cat deleted with /delete does not appear in /all', async () => {
    const catWithId2Response = await request(app).get('/cats/get-by-id/2');
    expect(catWithId2Response.status).toBe(200);
    
    const catWithId2 = catWithId2Response.body;

    const response = await request(app).get('/cats/all?sortByNameDirection=desc').expect(200);
    expect(response.body).toEqual(expect.arrayContaining([catWithId2]));

    await request(app)
        .delete('/cats/delete/2')
        .expect(200);

    const secondResponse = await request(app).get('/cats/all?sortByNameDirection=desc').expect(200);
    expect(secondResponse.body).not.toEqual(expect.arrayContaining([catWithId2]));
});
