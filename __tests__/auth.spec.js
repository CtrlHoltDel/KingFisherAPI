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

const getPlayersList = async (groupId, token, responseCode) => await request(app).get(`/players/${groupId}`).set(AUTHORIZATION_HEADER, `Bearer ${token}`).expect(responseCode || 200)


/*

    With custom test data
    4 users. Ctrlholtdel, testuser1, testuser2, testuser3.

    Ctrlholtdel owns group 1/2 (kingfisher, swan)
    testuser1 owns group 3 (ferret)

    Ctrlholtdel is a member of group 1/group 2
    testuser1 is a member of group 3 and has a pending request in group 1
    testuser2 has no groups but is a member of group 1
    testuser3 is a user with no groups.

*/

let ctrlholtdel;
let testuser1;
let testuser2;
let testuser3;
let user1Group1;
let user1Group2;


beforeAll(async () => {
    const { body : user1Login } = await request(app).post('/auth/login').send({ username: "ctrlholtdel", password: "test" }).expect(200);
    ctrlholtdel = user1Login.data

    const { body: user2Login } = await request(app).post('/auth/login').send({ username: "testuser1", password: "test" }).expect(200);
    testuser1 = user2Login.data

    const { body: user3Login } = await request(app).post('/auth/login').send({ username: "testuser2", password: "test" }).expect(200);
    testuser2 = user3Login.data

    const { body: user4Login } = await request(app).post('/auth/login').send({ username: "testuser3", password: "test" }).expect(200);
    testuser3 = user4Login.data

    const { body: user1Groups } = await request(app).get('/groups').set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`)

    user1Group1 = user1Groups.data.groups[0]
    user1Group2 = user1Groups.data.groups[1]
})

describe("Auth", () => {
    const newUser = { username: "test", password: "test" }

    beforeEach(async () => {
        await request(app).post('/auth/register').send(newUser).expect(201);
    });

    describe('POST::/auth/register', () => {
        it('Username cannot contain spaces', async () => {
            const { body: invalidUsername } = await request(app).post('/auth/register').send({ username: "test user", password: 123 }).expect(400)
    
            expect(invalidUsername.status).toBe(ERROR_STATUS);
            expect(invalidUsername.message).toBe('Username cannot contain spaces');
        });

        it('Attempting to register using a non-unique username returns an error', async () => {
            const { body } = await request(app).post('/auth/register').send(newUser).expect(400);
            expect(body.message).toBe('Username taken');
        })
    });


    describe('POST::/auth/login', () => {        
        it('Logging in with correct credentials returns a valid web token', async () => { 
            const { body } = await request(app).post('/auth/login').send(newUser)
            const { body : testRequest } = await request(app).get('/groups').set(AUTHORIZATION_HEADER, `Bearer ${body.data.token}`)
    
            expect(testRequest.status).not.toBe(ERROR_STATUS);
            expect(testRequest.message).not.toBe("Unauthorized");
        })
    
        it('Logging in with invalid credentials returns an error', async () => {
            const { body } = await request(app).post('/auth/login').send({ ...newUser, password: "Invalid Password" }).expect(403)
            expect(body.message).toBe('invalid credentials');
        });
    });

    describe('Malformed/No Token', () => {
        it('No token or invalid token returns an error', async () => {
            const { body: noTokenRequest } = await request(app).get('/players').expect(403)
            expect(noTokenRequest.status).toBe(ERROR_STATUS);
            expect(noTokenRequest.message).toBe('Restricted');
    
            const { body: invalidTokenRequest } = await request(app).get('/players').expect(403).set(AUTHORIZATION_HEADER, 'Bearer InvalidKey');
            expect(invalidTokenRequest.status).toBe(ERROR_STATUS);
            expect(invalidTokenRequest.message).toBe('Restricted');
        });
    });

})

describe('Groups', () => { 
    describe('GET::/groups:', () => {        
        it('Returns a list of groups', async () => {
            const { body } = await request(app).get('/groups').set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`).expect(200)
            expect(body.data.groups.length).toBe(2);

            const { body: userInNoGroups } = await request(app).get('/groups').set(AUTHORIZATION_HEADER, `Bearer ${testuser1.token}`)
            expect(userInNoGroups.data.groups).toHaveLength(1);
    
            const { body: userWithOneGroup } = await request(app).get('/groups').set(AUTHORIZATION_HEADER, `Bearer ${testuser3.token}`)
            expect(userWithOneGroup.data.groups).toHaveLength(0);
        });
    });

    describe('POST::/groups', () => { 
        it('Creates a new group', async () => {
            const newGroupName = 'newGroup'
    
            const { body: beforeAddingGroup } = await request(app).get('/groups').set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`)
            const beforeAddingGroupLength = beforeAddingGroup.data.groups.length
    
            const { body } = await request(app).post('/groups').send({ "name": newGroupName }).set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`)
            expect(body.data.name).toBe(newGroupName);
    
            const { body: newGroupList } = await request(app).get('/groups').set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`)
            expect(newGroupList.data.groups.length).toBe(beforeAddingGroupLength + 1);
        });
    })



    describe('GET::/groups/join?group_id=group_id:', () => {        
        it('Sends a request to join a group. Requesting again returns an error', async () => {
            console.log(testuser3)
            const { body: groupRequest } = await request(app).post(`/groups/join?group_id=${user1Group1.id}`).set(AUTHORIZATION_HEADER, `Bearer ${testuser3.token}`).expect(201)
            expect(groupRequest.data.message).toBe(`Request submitted to group: ${user1Group1.id}`);
    
            const { body: secondGroupRequest } = await request(app).post(`/groups/join?group_id=${user1Group1.id}`).set(AUTHORIZATION_HEADER, `Bearer ${testuser3.token}`).expect(422)
            expect(secondGroupRequest.message).toBe('You have a pending request');
        });

        it('Returns an error for an invalid ID', async () => {
            const { body: invalidGroupRequest } = await request(app).post(`/groups/join?group_id=invalid-group`).set(AUTHORIZATION_HEADER, `Bearer ${testuser3.token}`).expect(400)
            expect(invalidGroupRequest.status).toBe(ERROR_STATUS);
            expect(invalidGroupRequest.message).toBe("Cannot Process Request");
        });
    });


    describe('GET::/groups/requests', () => {        
        it('Returns a list of your pending group requests', async () => {
            const { body: initialRequests } = await request(app).get(`/groups/requests`).set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`)
            expect(initialRequests.data.groupRequests).toHaveLength(1);
    
            await request(app).post(`/groups/join?group_id=${user1Group2.id}`).set(AUTHORIZATION_HEADER, `Bearer ${testuser3.token}`).expect(201)

            const { body: after2Requests } = await request(app).get(`/groups/requests`).set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`).expect(200)
            
            expect(after2Requests.data.groupRequests).toHaveLength(2);
            expect(after2Requests.data.groupRequests[1].group_name).toBe(user1Group2.name);
    
            await request(app).post(`/groups/join?group_id=${user1Group2.id}`).set(AUTHORIZATION_HEADER, `Bearer ${testuser1.token}`).expect(201)
    
            const { body: after3Requests } = await request(app).get(`/groups/requests`).set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`).expect(200)
    
            expect(after3Requests.data.groupRequests).toHaveLength(3);
            expect(after3Requests.data.groupRequests[2].group_name).toBe(user1Group2.name);
        });
    });

    describe('POST::/groups/handle-request/:group_id?username=username', () => {
        it('Adds a user to a group you own', async () => {
            const { body: gettingGroupsBeforeAdded } = await request(app).get(`/groups`).set(AUTHORIZATION_HEADER, `Bearer ${testuser3.token}`).expect(200);
            expect(gettingGroupsBeforeAdded.data.groups).toHaveLength(0);

            const { body: addedResponse } = await request(app).post(`/groups/handle-request/${user1Group1.id}?username=${testuser3.username}`).send({ action: "add" }).set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`).expect(201)
            expect(addedResponse.status).toBe(SUCCESS_STATUS);
            expect(addedResponse.data.message).toBe(`${testuser3.username} added`);

            const { body: gettingGroupsAfterAdded } = await request(app).get(`/groups`).set(AUTHORIZATION_HEADER, `Bearer ${testuser3.token}`).expect(200);
            expect(gettingGroupsAfterAdded.data.groups).toHaveLength(1);
        });

        it('Can\'t add a user to a group you don\'t own', async () => {
            const { body } = await request(app).post(`/groups/handle-request/${user1Group1.id}?username=${testuser3.username}`).send({ action: "add" }).set(AUTHORIZATION_HEADER, `Bearer ${testuser1.token}`).expect(400)
            expect(body.status).toBe('error');
            expect(body.message).toBe('Error handling request');
        });

        it('Errors if you try adding to a non-existent group or non-existent user', async () => {
            const { body: withInvalidUsername } = await request(app).post(`/groups/handle-request/${user1Group1.id}?username=invalid-username`).send({ action: "add" }).set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`).expect(500)
            expect(withInvalidUsername.status).toBe(ERROR_STATUS);
            expect(withInvalidUsername.code).toBe("23503");

            const { body: withInvalidGroupId } = await request(app).post(`/groups/handle-request/invalid-group=id?username=${testuser3.username}`).send({ action: "add" }).set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`).expect(400)
            expect(withInvalidGroupId.status).toBe(ERROR_STATUS);
            expect(withInvalidGroupId.message).toBe("Error handling request");

            const { body: validGroupNoUser } = await request(app).post(`/groups/handle-request/${user1Group1.id}`).send({ action: "add" }).set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`).expect(500)
            expect(validGroupNoUser.status).toBe(ERROR_STATUS);
            expect(validGroupNoUser.message).toBe("No Null Values");
        });

        it('Validates the user if there is a pre-existing request', async () => {
            const { body: user3Request } = await request(app).post(`/groups/join?group_id=${user1Group1.id}`).set(AUTHORIZATION_HEADER, `Bearer ${testuser3.token}`).expect(201)
            expect(user3Request.status).toBe(SUCCESS_STATUS);

            const { body: validatedUser } = await request(app).post(`/groups/handle-request/${user1Group1.id}?username=${testuser3.username}`).send( { action: "add" }).set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`).expect(201);
            expect(validatedUser.status).toBe(SUCCESS_STATUS);
            expect(validatedUser.data.message).toBe(`${testuser3.username} added`);
        });
    });

})

describe('players', () => {     
    describe('GET::/players/:groupId', () => {
        it('GET: Returns a list of all players at that specific group', async () => {
            const { body: playersListGroup1 } = await getPlayersList(user1Group1.id, ctrlholtdel.token)
            
            expect(playersListGroup1.status).toBe(SUCCESS_STATUS);
            expect(playersListGroup1.data.players.length).toBe(3);
        });

        it('Returns a list of players if you\'re a member of the group', async () => {
            const { body: playersListValidatedUser } = await getPlayersList(user1Group1.id, testuser2.token)
            
            expect(playersListValidatedUser.status).toBe(SUCCESS_STATUS);
            expect(playersListValidatedUser.data.players.length).toBe(3);
            
        });

        it('Returns an error if the id is malformed', async () => {
            const { body: malformedId } = await getPlayersList('invalid-group-id', ctrlholtdel.token, 400)

            expect(malformedId.status).toBe(ERROR_STATUS);
            expect(malformedId.message).toBe("Cannot Process Request");  
        });

        it('E2E: Returns an error if the user has no access to the group', async () => {
            const newUser = await newUserSetup("newUser")

            const { body: playersListGroup1Unvalidated } = await getPlayersList(user1Group1.id, newUser.token, 400) 
            expect(playersListGroup1Unvalidated.status).toBe(ERROR_STATUS);
            expect(playersListGroup1Unvalidated.message).toBe('Cannot Process Request');
    
            await request(app).post(`/groups/join?group_id=${user1Group1.id}`).set(AUTHORIZATION_HEADER, `Bearer ${newUser.token}`).expect(201)
            const { body: playersListGroup1UnvalidatedAfterRequest } = await getPlayersList(user1Group1.id, newUser.token, 400)
            expect(playersListGroup1UnvalidatedAfterRequest.status).toBe(ERROR_STATUS);
            expect(playersListGroup1UnvalidatedAfterRequest.message).toBe('Pending Request');    

            const { body: addedResponse } = await request(app).post(`/groups/handle-request/${user1Group1.id}?username=${newUser.username}`).send({ action: "add" }).set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`).expect(201)
            expect(addedResponse.status).toBe(SUCCESS_STATUS);
            expect(addedResponse.data.message).toBe(`${newUser.username} added`);

            const { body: playersListGroup1AfterValidation } = await getPlayersList(user1Group1.id, newUser.token)
            expect(playersListGroup1AfterValidation.status).toBe(SUCCESS_STATUS);
            expect(playersListGroup1AfterValidation.data.players).toHaveLength(3);    
        })
    });

    describe('POST::/players/:groupId/:playerName', () => {
        const newPlayerName = 'new_player'

        it('Admin can add a new player to the group', async () => {
            const { body: initialPlayersListGroup } = await getPlayersList(user1Group1.id, ctrlholtdel.token)
            expect(initialPlayersListGroup.status).toBe(SUCCESS_STATUS);
            expect(initialPlayersListGroup.data.players).toHaveLength(3);

            const { body: addedPlayer } = await request(app).post(`/players/${user1Group1.id}/${newPlayerName}`).set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`).expect(201)
            expect(addedPlayer.status).toBe(SUCCESS_STATUS);
            expect(addedPlayer.data.addedPlayer.name).toBe(newPlayerName);

            const { body: afterPlayersListGroup } = await getPlayersList(user1Group1.id, ctrlholtdel.token)
            expect(afterPlayersListGroup.status).toBe(SUCCESS_STATUS);
            expect(afterPlayersListGroup.data.players).toHaveLength(4);
        })

        it.skip('Validated Users can add a new player', async () => {
            // get a validated user
            const { body: addedByTestUser } = await request(app).post(`/players/${user1Group1.id}/${newPlayerName}`).set(AUTHORIZATION_HEADER, `Bearer ${testuser2.token}`).expect(201)
            expect(addedByTestUser).toBe();
            console.log(addedByTestUser)

        });

    //    it('Returns an error if trying to add a duplicate player', () => {
        
    //    });

    //    it('Can only add players if the user is part of that group', () => {
        
    //    });
    });

})