const app = require("../app");
const db = require("../db/connection");
const request = require("supertest");

const seedTest = require("../db/test-seed");

beforeEach(async () => { 
    await seedTest();
});

afterAll(async () => {
    db.end()
});

// describe("/auth", () => {
//     it('Attempting to register using a non-unique username returns an error', async () => {
//         const testUser = { username: "test", password: "test" }
//         await request(app).post('/auth/register').send(testUser).expect(201);
//         const { body } = await request(app).post('/auth/register').send(testUser).expect(400);
//     })

//     // test('Logging in returns a valid web token', async () => { 
//     //     const registeringUser = ""
//     // })
// })