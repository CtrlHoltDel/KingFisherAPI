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

describe("/auth", () => {
    const testUser = { username: "test", password: "test" }

    beforeEach(async () => {
        const { body } = await request(app).post('/auth/register').send(testUser).expect(201);
        console.log(body.data, "<<")
    });

    it('Attempting to register using a non-unique username returns an error', async () => {
        const { body } = await request(app).post('/auth/register').send(testUser).expect(400);
        expect(body.message).toBe('Username taken');
    })

    it('Logging in with correct credentials returns a valid web token', async () => { 
        const { body } = await request(app).post('/auth/login').send(testUser)
        console.log(body.data)

        // Make a request here to test
    })

    it('Logging in with invalid credentials returns an error', async () => {
        const { body } = await request(app).post('/auth/login').send({ ...testUser, password: "Invalid Password"})
        expect(body.message).toBe('invalid credentials');
    });
})

describe('/groups', () => { 
    beforeEach(async () => {
        const { body } = await request(app).post('/auth/login').send({ username: "ctrlholtdel", password: "test" }).expect(200);
        console.log(body.loginInfo)
    })

    it('should ', () => {
        
    });

 })