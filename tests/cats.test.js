// const request = require('supertest');
// const app = require('../app');
// const { fail } = require('assert');
// const { MongoMemoryServer } = require('mongodb-memory-server');
// const { MongoClient } = require("mongodb");

// describe('cat tests', () => {
//     test('/all', async () => {
//         const response = await request(app).get('/cats/all?sortByNameDirection=asc');
//         expect(response.status).toBe(200);

//         expect(response.body[0]).toHaveProperty('id');
//         expect(response.body[0]).toHaveProperty('name');
//         expect(response.body[0]).toHaveProperty('age');
//         expect(response.body[0]).toHaveProperty('weight');
//     }, 100000);

//     test('/count', async () => {
//         const response = await request(app).get('/cats/count');
//         expect(response.status).toBe(200);
//     }, 100000);

//     test('get-by-id exists', async () => {
//         const response = await request(app).get('/cats/get-by-id/1');
//         expect(response.status).toBe(200);

//         expect(response.body).toHaveProperty('id');
//         expect(response.body).toHaveProperty('name');
//         expect(response.body).toHaveProperty('age');
//         expect(response.body).toHaveProperty('weight');
//     }, 100000);

//     test('get-by-id does not exist', async () => {
//         const response = await request(app).get('/cats/get-by-id/989565');
//         expect(response.status).toBe(404);
//     }, 100000);

//     test('update with /update appears in /all', async () => {
//         let id = 1;
//         while (await request(app).get('/cats/get-by-id/' + id).status === 404) {
//             id++;
//             console.log('id now' + id);
//         }

//         const newCat = { name: 'TestCat', age: 20, weight: 3.2 };
//         await request(app)
//             .put('/cats/update/' + id)
//             .send(newCat)
//             .expect(200);

//         const response = await request(app).get('/cats/all').expect(200);
//         expect(response.body).toEqual(expect.arrayContaining([{ id: id, name: 'TestCat', age: 20, weight: 3.2 }]));
//     }, 100000);

//     // test('cat deleted with /delete does not appear in /all', async () => {
//     //     const catWithId1Response = await request(app).get('/cats/get-by-id/1');
//     //     expect(catWithId1Response.status).toBe(200);

//     //     const catWithId1 = catWithId1Response.body;

//     //     const response = await request(app).get('/cats/all').expect(200);
//     //     expect(response.body).toEqual(expect.arrayContaining([catWithId1]));

//     //     await request(app)
//     //         .delete('/cats/delete/1')
//     //         .expect(200);

//     //     const secondResponse = await request(app).get('/cats/all?sortByNameDirection=desc').expect(200);

//     //     let found = false;
//     //     for (let cat of secondResponse.body)
//     //         if (cat.id === 1)
//     //             found = true;
//     //     expect(found).toEqual(false);

//     //     // expect(secondResponse.body).not.toEqual(expect.arrayContaining([catWithId1]));
//     // });

//     test('cat added with /add appears in /all', async () => {
//         const toAdd = { name: 'TestCat', age: 20, weight: 3.2 };
//         await request(app)
//             .post('/cats/add')
//             .send(toAdd)
//             .expect(200);

//         const response = await request(app).get('/cats/all').expect(200);

//         console.log('all cats received: ' + JSON.stringify(response));

//         let found = false;
//         for (let cat of response.body)
//             if (cat.name === 'TestCat')
//                 found = true;

//         expect(found).toEqual(true);
//     }, 100000);
// });


// describe('toy tests', () => {
//     test('/all', async () => {
//         const response = await request(app).get('/toys/all');
//         expect(response.status).toBe(200);

//         expect(response.body[0]).toHaveProperty('catId');
//         expect(response.body[0]).toHaveProperty('name');
//     }, 100000);

//     test('/count', async () => {
//         const response = await request(app).get('/toys/count');
//         expect(response.status).toBe(200);
//     }, 100000);

//     test('get-by-id exists', async () => {
//         const response = await request(app).get('/toys/get-by-id/1');
//         expect(response.status).toBe(200);

//         expect(response.body).toHaveProperty('catId');
//         expect(response.body).toHaveProperty('name');
//     }, 100000);

//     test('get-by-id does not exist', async () => {
//         const response = await request(app).get('/toys/get-by-id/989565');
//         expect(response.status).toBe(404);
//     }, 100000);

//     test('update with /update appears in /all', async () => {
//         let id = 1;
//         while (await request(app).get('/toys/get-by-id/' + id).status === 404) {
//             id++;
//             console.log('id now' + id);
//         }

//         const newToy = { name: 'TestToy', catId: 1 };
//         await request(app)
//             .put('/toys/update/' + id)
//             .send(newToy)
//             .expect(200);

//         const response = await request(app).get('/toys/all').expect(200);
//         expect(response.body).toEqual(expect.arrayContaining([{ id: id, name: 'TestToy', catId: 1 }]));
//     }, 100000);


//     test('toy added with /add appears in /all', async () => {
//         const toAdd = { name: 'TestToy', catId: 1 };
//         await request(app)
//             .post('/toys/add')
//             .send(toAdd)
//             .expect(200);

//         const response = await request(app).get('/toys/all').expect(200);

//         console.log('all toys received: ' + JSON.stringify(response));

//         let found = false;
//         for (let toy of response.body)
//             if (toy.name === 'TestToy')
//                 found = true;

//         expect(found).toEqual(true);
//     }, 100000);

// })

