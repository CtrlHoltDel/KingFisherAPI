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
    });

    it('Attempting to register using a non-unique username returns an error', async () => {
        const { body } = await request(app).post('/auth/register').send(testUser).expect(400);
        expect(body.message).toBe('Username taken');
    })

    it('Logging in with correct credentials returns a valid web token', async () => { 
        const { body } = await request(app).post('/auth/login').send(testUser)
        const { body : testRequest } = await request(app).get('/groups').set('Authorization', `Bearer ${body.data.token}`)

        expect(testRequest.status).not.toBe("error");
        expect(testRequest.message).not.toBe("Unauthorized");
    })

    it('Logging in with invalid credentials returns an error', async () => {
        const { body } = await request(app).post('/auth/login').send({ ...testUser, password: "Invalid Password"})
        expect(body.message).toBe('invalid credentials');
    });
})

describe('Groups', () => { 
    let user1Token;
    let user2Token;
    let user3Token;
    let user1Group1;
    let user1Group2;

    beforeAll(async () => {
        const { body : user1Login } = await request(app).post('/auth/login').send({ username: "ctrlholtdel", password: "test" }).expect(200);
        user1Token = user1Login.data.token

        const { body: user2Login } = await request(app).post('/auth/login').send({ username: "testuser", password: "test" }).expect(200);
        user2Token = user2Login.data.token

        const { body: user3Login } = await request(app).post('/auth/login').send({ username: "testuser2", password: "test" }).expect(200);
        user3Token = user3Login.data.token

        const { body: user1Groups } = await request(app).get('/groups').set('Authorization', `Bearer ${user1Token}`)

        user1Group1 = user1Groups.data.groups[0]
        user1Group2 = user1Groups.data.groups[1]
    })

    it('GET::/groups: Should return a list of groups', async () => {
        const { body } = await request(app).get('/groups').set('Authorization', `Bearer ${user1Token}`)
        expect(body.data.groups.length).toBe(2);
    });

    it('POST::/groups: Creates a new group', async () => {
        const newGroupName = 'newGroup'

        const { body: beforeAddingGroup } = await request(app).get('/groups').set('Authorization', `Bearer ${user1Token}`)

        const beforeAddingGroupLength = beforeAddingGroup.data.groups.length

        const { body } = await request(app).post('/groups').send({ "name": newGroupName }).set('Authorization', `Bearer ${user1Token}`)

        expect(body.data.name).toBe(newGroupName);

        const { body: newGroupList } = await request(app).get('/groups').set('Authorization', `Bearer ${user1Token}`)

        expect(newGroupList.data.groups.length).toBe(beforeAddingGroupLength + 1);
    });

    it('GET::/groups/join?id=id: Sends a request to join a group. Requesting again returns an error', async () => {
        const { body: groupRequest } = await request(app).post(`/groups/join?group_id=${user1Group1.id}`).set('Authorization', `Bearer ${user2Token}`).expect(201)

        expect(groupRequest.data.message).toBe(`Request submitted to group: ${user1Group1.id}`);

        const { body: secondGroupRequest } = await request(app).post(`/groups/join?group_id=${user1Group1.id}`).set('Authorization', `Bearer ${user2Token}`).expect(200)
        
        expect(secondGroupRequest.message).toBe('You have a pending request');
    });

    it('GET::/groups/requests: Returns a list of your pending group requests', async () => {
        const { body: initialRequests } = await request(app).get(`/groups/requests`).set('Authorization', `Bearer ${user1Token}`)

        expect(initialRequests.data.groupRequests).toHaveLength(0);

        await request(app).post(`/groups/join?group_id=${user1Group1.id}`).set('Authorization', `Bearer ${user2Token}`).expect(201)

        const { body: after1Request } = await request(app).get(`/groups/requests`).set('Authorization', `Bearer ${user1Token}`).expect(200)

        expect(after1Request.data.groupRequests).toHaveLength(1);
        expect(after1Request.data.groupRequests[0].group_name).toBe(user1Group1.name);

        await request(app).post(`/groups/join?group_id=${user1Group2.id}`).set('Authorization', `Bearer ${user3Token}`).expect(201)

        const { body: after2Requests } = await request(app).get(`/groups/requests`).set('Authorization', `Bearer ${user1Token}`).expect(200)
        
        expect(after2Requests.data.groupRequests).toHaveLength(2);
        expect(after2Requests.data.groupRequests[1].group_name).toBe(user1Group2.name);

        await request(app).post(`/groups/join?group_id=${user1Group2.id}`).set('Authorization', `Bearer ${user2Token}`).expect(201)

        const { body: after3Requests } = await request(app).get(`/groups/requests`).set('Authorization', `Bearer ${user1Token}`).expect(200)

        expect(after3Requests.data.groupRequests).toHaveLength(3);
        expect(after3Requests.data.groupRequests[2].group_name).toBe(user1Group2.name);
    });

    it.only('POST::/groups/adduser?username ', () => {
        
    });

 })