const app = require("../app");
const db = require("../db/connection");
const request = require("supertest");

const seedTest = require("../db/test-seed");

const ERROR_STATUS = 'error'
const SUCCESS_STATUS = 'success'
const AUTHORIZATION_HEADER = 'Authorization'

beforeEach(async () => { 
    await seedTest();
});

afterAll(async () => {
    db.end()
});

const newUserSetup = async (username) => {
    const newUserDetails = { username, password: "123" }
    await request(app).post('/auth/register').send(newUserDetails)
    const { body: newUserResponse } = await request(app).post('/auth/login').send(newUserDetails)
    return newUserResponse.data
}

describe("Auth", () => {
    const testUser = { username: "test", password: "test" }

    beforeEach(async () => {
        await request(app).post('/auth/register').send(testUser).expect(201);
    });

    it('POST::/auth/register: Username cannot contain spaces', async () => {
        const { body: invalidUsername } = await request(app).post('/auth/register').send({ username: "test user", password: 123 }).expect(400)

        expect(invalidUsername.status).toBe(ERROR_STATUS);
        expect(invalidUsername.message).toBe('Username cannot contain spaces');
    });

    it('POST::/auth/register: Attempting to register using a non-unique username returns an error', async () => {
        const { body } = await request(app).post('/auth/register').send(testUser).expect(400);
        expect(body.message).toBe('Username taken');
    })

    it('POST::/auth/login: Logging in with correct credentials returns a valid web token', async () => { 
        const { body } = await request(app).post('/auth/login').send(testUser)
        const { body : testRequest } = await request(app).get('/groups').set(AUTHORIZATION_HEADER, `Bearer ${body.data.token}`)

        expect(testRequest.status).not.toBe(ERROR_STATUS);
        expect(testRequest.message).not.toBe("Unauthorized");
    })

    it('POST::/auth/login: Logging in with invalid credentials returns an error', async () => {
        const { body } = await request(app).post('/auth/login').send({ ...testUser, password: "Invalid Password" }).expect(403)
        expect(body.message).toBe('invalid credentials');
    });

})

describe('Groups', () => { 
    let user1;
    let user2;
    let user3;
    let user1Group1;
    let user1Group2;

    beforeAll(async () => {
        const { body : user1Login } = await request(app).post('/auth/login').send({ username: "ctrlholtdel", password: "test" }).expect(200);
        user1 = user1Login.data

        const { body: user2Login } = await request(app).post('/auth/login').send({ username: "testuser", password: "test" }).expect(200);
        user2 = user2Login.data

        const { body: user3Login } = await request(app).post('/auth/login').send({ username: "testuser2", password: "test" }).expect(200);
        user3 = user3Login.data

        const { body: user1Groups } = await request(app).get('/groups').set(AUTHORIZATION_HEADER, `Bearer ${user1.token}`)

        user1Group1 = user1Groups.data.groups[0]
        user1Group2 = user1Groups.data.groups[1]
    })

    it('GET::/groups: Returns a list of groups', async () => {
        const { body } = await request(app).get('/groups').set(AUTHORIZATION_HEADER, `Bearer ${user1.token}`)
        expect(body.data.groups.length).toBe(2);

    });

    it('POST::/groups: Creates a new group', async () => {
        const newGroupName = 'newGroup'

        const { body: beforeAddingGroup } = await request(app).get('/groups').set(AUTHORIZATION_HEADER, `Bearer ${user1.token}`)
        const beforeAddingGroupLength = beforeAddingGroup.data.groups.length

        const { body } = await request(app).post('/groups').send({ "name": newGroupName }).set(AUTHORIZATION_HEADER, `Bearer ${user1.token}`)
        expect(body.data.name).toBe(newGroupName);

        const { body: newGroupList } = await request(app).get('/groups').set(AUTHORIZATION_HEADER, `Bearer ${user1.token}`)
        expect(newGroupList.data.groups.length).toBe(beforeAddingGroupLength + 1);
    });

    describe.only('GET::/groups/join?id=id:', () => {        
        it('Sends a request to join a group. Requesting again returns an error', async () => {
            const { body: groupRequest } = await request(app).post(`/groups/join?group_id=${user1Group1.id}`).set(AUTHORIZATION_HEADER, `Bearer ${user3.token}`).expect(201)
            expect(groupRequest.data.message).toBe(`Request submitted to group: ${user1Group1.id}`);
    
            const { body: secondGroupRequest } = await request(app).post(`/groups/join?group_id=${user1Group1.id}`).set(AUTHORIZATION_HEADER, `Bearer ${user3.token}`).expect(422)
            expect(secondGroupRequest.message).toBe('You have a pending request');
        });

        it('Returns an error for an invalid ID', async () => {
            const { body: invalidGroupRequest } = await request(app).post(`/groups/join?group_id=invalid-group`).set(AUTHORIZATION_HEADER, `Bearer ${user3.token}`).expect(400)
            expect(invalidGroupRequest.status).toBe(ERROR_STATUS);
            expect(invalidGroupRequest.message).toBe("Cannot Process Request");
        });
    });


    it('GET::/groups/requests: Returns a list of your pending group requests', async () => {
        const { body: initialRequests } = await request(app).get(`/groups/requests`).set(AUTHORIZATION_HEADER, `Bearer ${user1.token}`)

        expect(initialRequests.data.groupRequests).toHaveLength(1);

        await request(app).post(`/groups/join?group_id=${user1Group2.id}`).set(AUTHORIZATION_HEADER, `Bearer ${user3.token}`).expect(201)

        const { body: after2Requests } = await request(app).get(`/groups/requests`).set(AUTHORIZATION_HEADER, `Bearer ${user1.token}`).expect(200)
        
        expect(after2Requests.data.groupRequests).toHaveLength(2);
        expect(after2Requests.data.groupRequests[1].group_name).toBe(user1Group2.name);

        await request(app).post(`/groups/join?group_id=${user1Group2.id}`).set(AUTHORIZATION_HEADER, `Bearer ${user2.token}`).expect(201)

        const { body: after3Requests } = await request(app).get(`/groups/requests`).set(AUTHORIZATION_HEADER, `Bearer ${user1.token}`).expect(200)

        expect(after3Requests.data.groupRequests).toHaveLength(3);
        expect(after3Requests.data.groupRequests[2].group_name).toBe(user1Group2.name);
    });

    describe('POST::/groups/handle-request/:group_id?username=username', () => {
        it('Adds a user to a group you own', async () => {
            const { body: gettingGroupsBeforeAdded } = await request(app).get(`/groups`).set(AUTHORIZATION_HEADER, `Bearer ${user3.token}`).expect(200);
            expect(gettingGroupsBeforeAdded.data.groups).toHaveLength(0);

            const { body: addedResponse } = await request(app).post(`/groups/handle-request/${user1Group1.id}?username=${user3.username}`).send({ action: "add" }).set(AUTHORIZATION_HEADER, `Bearer ${user1.token}`).expect(201)
            expect(addedResponse.status).toBe(SUCCESS_STATUS);
            expect(addedResponse.data.message).toBe(`${user3.username} added`);

            const { body: gettingGroupsAfterAdded } = await request(app).get(`/groups`).set(AUTHORIZATION_HEADER, `Bearer ${user3.token}`).expect(200);
            expect(gettingGroupsAfterAdded.data.groups).toHaveLength(1);
        });

        it('Can\'t add a user to a group you don\'t own', async () => {
            const { body } = await request(app).post(`/groups/handle-request/${user1Group1.id}?username=${user3.username}`).send({ action: "add" }).set(AUTHORIZATION_HEADER, `Bearer ${user2.token}`).expect(400)
            expect(body.status).toBe('error');
            expect(body.message).toBe('Error handling request');
        });

        it('Errors if you try adding to a non-existent group or non-existent user', async () => {
            const { body: withInvalidUsername } = await request(app).post(`/groups/handle-request/${user1Group1.id}?username=invalid-username`).send({ action: "add" }).set(AUTHORIZATION_HEADER, `Bearer ${user1.token}`).expect(500)
            expect(withInvalidUsername.status).toBe(ERROR_STATUS);
            expect(withInvalidUsername.code).toBe("23503");

            const { body: withInvalidGroupId } = await request(app).post(`/groups/handle-request/invalid-group=id?username=${user3.username}`).send({ action: "add" }).set(AUTHORIZATION_HEADER, `Bearer ${user1.token}`).expect(400)
            expect(withInvalidGroupId.status).toBe(ERROR_STATUS);
            expect(withInvalidGroupId.message).toBe("Error handling request");

            const { body: validGroupNoUser } = await request(app).post(`/groups/handle-request/${user1Group1.id}`).send({ action: "add" }).set(AUTHORIZATION_HEADER, `Bearer ${user1.token}`).expect(500)
            expect(validGroupNoUser.status).toBe(ERROR_STATUS);
            expect(validGroupNoUser.message).toBe("No Null Values");
        });
    });

})



describe('players', () => { 
    let user1;
    let user1Group1;


    beforeAll(async () => {
        const { body : user1Login } = await request(app).post('/auth/login').send({ username: "ctrlholtdel", password: "test" }).expect(200);
        user1 = user1Login.data

        const { body: user1Groups } = await request(app).get('/groups').set(AUTHORIZATION_HEADER, `Bearer ${user1.token}`)

        user1Group1 = user1Groups.data.groups[0]
    })

    it('GET::/players?groupid: Returns a list of all players at that specific group', async () => {
        const { body: playersListGroup1 } = await request(app).get(`/players/${user1Group1.id}`).set(AUTHORIZATION_HEADER, `Bearer ${user1.token}`)
        
        expect(playersListGroup1.status).toBe(SUCCESS_STATUS);
        expect(playersListGroup1.data.players.length).toBe(3);
    });

    it('GET::/players?groupid=: Returns an error if the user isn\'t a part of the group or validated', async () => {
        // Setting up a new user
        const newUser = await newUserSetup("newUser")

        // Trying to access by manipulating endpoint
        const { body: playersListGroup1Unvalidated } = await request(app).get(`/players/${user1Group1.id}`).set(AUTHORIZATION_HEADER, `Bearer ${newUser.token}`).expect(400)

        expect(playersListGroup1Unvalidated.status).toBe(ERROR_STATUS);
        expect(playersListGroup1Unvalidated.message).toBe('Cannot Process Request');

        // Trying to access after requesting to join the group but yet to be validated.
        await request(app).post(`/groups/join?group_id=${user1Group1.id}`).set(AUTHORIZATION_HEADER, `Bearer ${newUser.token}`).expect(201)
        const { body: playersListGroup1UnvalidatedAfterRequest } = await request(app).get(`/players/${user1Group1.id}`).set(AUTHORIZATION_HEADER, `Bearer ${newUser.token}`).expect(400)

        expect(playersListGroup1UnvalidatedAfterRequest.status).toBe(ERROR_STATUS);
        expect(playersListGroup1UnvalidatedAfterRequest.message).toBe('Pending Request');    


        // TODO: Once group validation is completed, another test here to make sure they can access players after being validated.
        // TODO: Once blocking has been implimented, also check blocking here.

    })

})