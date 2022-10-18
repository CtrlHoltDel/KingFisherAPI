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

describe.skip("/auth", () => {
    const testUser = { username: "test", password: "test" }

    beforeEach(async () => {
        await request(app).post('/auth/register').send(testUser).expect(201);
    });

    it('Attempting to register using a non-unique username returns an error', async () => {
        const { body } = await request(app).post('/auth/register').send(testUser).expect(400);
        expect(body.message).toBe('Username taken');
    })

    it('Logging in with correct credentials returns a valid web token', async () => { 
        const { body } = await request(app).post('/auth/login').send(testUser)
        expect(body.response.token).not.toBe(null);
    })

    it('Logging in with invalid credentials returns an error', async () => {
        const { body } = await request(app).post('/auth/login').send({ ...testUser, password: "Invalid Password"})
        expect(body.message).toBe('invalid credentials');
    });
})

describe("/groups", () => {
    describe('/Logged in as user', () => { 
        let token;

        beforeEach(async () => {
            const { body } = await request(app).post('/auth/login').send({ username: "ctrlholtdel", password: process.env.TEST_PASSWORD }).expect(200);
            token = body.response.token
        });

        it('Test', async () => {


        });

     })

})