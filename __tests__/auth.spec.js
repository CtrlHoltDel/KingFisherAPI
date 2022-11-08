const app = require("../app");
const db = require("../db/connection");
const request = require("supertest");

const seedTest = require("../db/test-seed");
const { restrictedError } = require("../utils/responses");

const ERROR_STATUS = 'error'
const SUCCESS_STATUS = 'success'
const AUTHORIZATION_HEADER = 'Authorization'
const CANNOT_PROCESS_REQUEST = 'Cannot Process Request'


// TODO show blocked users

beforeEach(async () => { 
    await seedTest();
});

afterAll(async () => {
    db.end()
});

const newUserSetup = async (username) => {
    const password = 'test'
    await register(username, password)
    const { body: newUserResponse } = await login(username, password)
    return newUserResponse.data
}

// TODO: To get player info url shouldn't need group ID

// ## POST /auth/register
const register = async (username, password, expectedResponseCode) => await request(app).post('/auth/register').send({ username, password }).expect(expectedResponseCode || 201)

// ## POST /auth/login
const login = async (username, password, expectedResponseCode) => await request(app).post('/auth/login').send({ username, password }).expect(expectedResponseCode || 200)

// ## GET /players/:group_id?limit=limit&search=search
const getPlayersList = async (groupId, token, expectedResponseCode, limit, search) => await request(app).get(`/players/${groupId}?limit=${limit || ""}&search=${search || ""}`).set(AUTHORIZATION_HEADER, `Bearer ${token}`).expect(expectedResponseCode || 200)

// ## POST /players/:group_id
const addPlayer = async (groupId, token, newPlayerName, expectedResponseCode) => await request(app).post(`/players/${groupId}`).send({ playerName: newPlayerName }).set(AUTHORIZATION_HEADER, `Bearer ${token}`).expect(expectedResponseCode || 201)
// ## GET /notes/:player_id
const getNotes = async (playerId, token, expectedResponseCode) => await request(app).get(`/notes/${playerId}`).set(AUTHORIZATION_HEADER, `Bearer ${token}`).expect(expectedResponseCode || 200)

// ## POST /notes/:player_id
const addNote = async (playerId, token, noteBody, expectedResponseCode) => await request(app).post(`/notes/${playerId}`).send(noteBody).set(AUTHORIZATION_HEADER, `Bearer ${token}`).expect(expectedResponseCode || 201)

// ## POST /groups/handle-request/:group_id?username=username
const addUserToGroup = async (usernameToAdd, token, groupId, expectedResponseCode) => await request(app).post(`/groups/handle-request/${groupId}?username=${usernameToAdd}`).send({ action: "add" }).set(AUTHORIZATION_HEADER, `Bearer ${token}`).expect(expectedResponseCode || 201)
const setUserToAdmin = async (usernameToSetToAdmin, token, groupId, expectedResponseCode) => await request(app).post(`/groups/handle-request/${groupId}?username=${usernameToSetToAdmin}`).send({ action: 'admin' }).set(AUTHORIZATION_HEADER, `Bearer ${token}`).expect(expectedResponseCode || 201)

// ## GET /groups
const getGroups = async (token, expectedResponseCode) => await request(app).get('/groups').set(AUTHORIZATION_HEADER, `Bearer ${token}`).expect(expectedResponseCode || 200)

// ## POST /groups
const addGroup = async(name, token, expectedResponseCode) => await request(app).post('/groups').send({ name }).set(AUTHORIZATION_HEADER, `Bearer ${token}`).expect(expectedResponseCode || 201)

/*

    With standard test data
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
    const { body: user1Login } = await login("ctrlholtdel", "test")
    ctrlholtdel = user1Login.data

    const { body: user2Login } = await login("testuser1", "test")
    testuser1 = user2Login.data

    const { body: user3Login } = await login("testuser2", "test")
    testuser2 = user3Login.data

    const { body: user4Login } = await login("testuser3", "test")
    testuser3 = user4Login.data

    const { body: user1Groups } = await getGroups(ctrlholtdel.token)

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
            const { body: noTokenRequest } = await getPlayersList(user1Group1.id, null, 403)
            expect(noTokenRequest.status).toBe(ERROR_STATUS);
            expect(noTokenRequest.message).toBe('Restricted');

            const { body: invalidTokenRequest } = await getPlayersList(user1Group1.id, 'Invalid Key', 403)
            expect(invalidTokenRequest.status).toBe(ERROR_STATUS);
            expect(invalidTokenRequest.message).toBe('Restricted');
        });
    });

})

describe('Groups', () => { 
    describe('GET::/groups:', () => {        
        it('Returns a list of groups', async () => {
            const { body } = await getGroups(ctrlholtdel.token)
            expect(body.data.groups.length).toBe(2);

            const { body: userInNoGroups } = await getGroups(testuser1.token)
            expect(userInNoGroups.data.groups).toHaveLength(2);

            const { body: userWithOneGroup } = await getGroups(testuser3.token)
            expect(userWithOneGroup.data.groups).toHaveLength(0);
        });

        it('Returns a list of users if you\'re an administrator of that group', async () => {
            const { body: userWithAdmin } = await getGroups(ctrlholtdel.token);
            expect(userWithAdmin.data.groups[0].users).toHaveLength(3);
            expect(userWithAdmin.data.groups[1].users).toHaveLength(1);
            
            const { body: userWithoutAdmin } = await getGroups(testuser2.token);

            expect(userWithoutAdmin.data.groups[0].validated).toBe(true);
            expect(userWithoutAdmin.data.groups[0].admin).toBe(false);
            expect(userWithoutAdmin.data.groups[0].users).toHaveLength(0);
        });
    });

    describe('POST::/groups', () => { 
        it('Creates a new group', async () => {
            const newGroupName = 'newGroup'
    
            const { body: beforeAddingGroup } = await getGroups(ctrlholtdel.token)
            const beforeAddingGroupLength = beforeAddingGroup.data.groups.length
            
            const { body } = await addGroup(newGroupName, ctrlholtdel.token)
            expect(body.data.addedGroup.name).toBe(newGroupName.toLowerCase());
            expect(body.data.addedGroup.id).toBeTruthy();

            const { body: newGroupList } = await getGroups(ctrlholtdel.token)
            expect(newGroupList.data.groups.length).toBe(beforeAddingGroupLength + 1);
            expect(body.data.addedGroup.id).toBe(newGroupList.data.groups[2].id);
        });

        it('Returns an error if trying to add an empty group', async () => {
            const { body } = await addGroup(undefined, ctrlholtdel.token, 401)
            expect(body.status).toBe(ERROR_STATUS);
            expect(body.message).toBe('Group name must be longer than 3 characters');
        });
    })

    describe('GET::/groups/join?group_id=group_id:', () => {        
        it('Sends a request to join a group. Requesting again returns an error', async () => {
            const { body: groupRequest } = await request(app).post(`/groups/join?group_id=${user1Group1.id}`).set(AUTHORIZATION_HEADER, `Bearer ${testuser3.token}`).expect(201)
            expect(groupRequest.data.message).toBe(`Request submitted to group: ${user1Group1.id}`);
    
            const { body: secondGroupRequest } = await request(app).post(`/groups/join?group_id=${user1Group1.id}`).set(AUTHORIZATION_HEADER, `Bearer ${testuser3.token}`).expect(422)
            expect(secondGroupRequest.message).toBe('You have a pending request');
        });

        it('Returns an error for an invalid ID', async () => {
            const { body: invalidGroupRequest } = await request(app).post(`/groups/join?group_id=invalid-group`).set(AUTHORIZATION_HEADER, `Bearer ${testuser3.token}`).expect(400)
            expect(invalidGroupRequest.status).toBe(ERROR_STATUS);
            expect(invalidGroupRequest.message).toBe(CANNOT_PROCESS_REQUEST);
        });
    });

    describe('PUT::/groups/:group_id/username', () => {
        it('Can set a preexisting user to administrator', async () => {
            await addUserToGroup(testuser3.username, ctrlholtdel.token, user1Group1.id)

            const { body: groupsList } = await getGroups(ctrlholtdel.token);
            const addedUser = groupsList.data.groups[0].users.find(user => user.username === testuser3.username)

            expect(addedUser.validated).toBe(true);
            expect(addedUser.admin).toBe(false);

            expect(groupAdminUpdated.status).toBe(SUCCESS_STATUS);
            expect(groupAdminUpdated.data.message).toBe(`${testuser3.username} updated to admin on group ${user1Group1.id}`);
        });
    });

    describe('POST::/groups/handle-request/:group_id?username=username', () => {
        it.only('Adds a user to a group you own', async () => {
            const { body: gettingGroupsBeforeAdded } = await request(app).get(`/groups`).set(AUTHORIZATION_HEADER, `Bearer ${testuser3.token}`).expect(200);
            expect(gettingGroupsBeforeAdded.data.groups).toHaveLength(0);

            const { body: addedResponse } = await addUserToGroup(testuser3.username, ctrlholtdel.token, user1Group1.id)

            expect(addedResponse.status).toBe(SUCCESS_STATUS);
            expect(addedResponse.data.message).toBe(`${testuser3.username} added`);

            const { body: gettingGroupsAfterAdded } = await request(app).get(`/groups`).set(AUTHORIZATION_HEADER, `Bearer ${testuser3.token}`).expect(200);
            expect(gettingGroupsAfterAdded.data.groups).toHaveLength(1);
            expect(gettingGroupsAfterAdded.data.groups[0].validated).toBe(true);
        });

        it('Can\'t add a user to a group you don\'t own or are not an admin of', async () => {
            const { body } = await addUserToGroup(testuser3.username, testuser1.token, user1Group1.id, 400)
            expect(body.status).toBe('error');
            expect(body.message).toBe(restrictedError.message);
        });

        it('Errors if you try adding to a non-existent group or non-existent user', async () => {

            const { body: withInvalidUsername } = await addUserToGroup("invalid-username", ctrlholtdel.token, user1Group1.id, 500)
            expect(withInvalidUsername.status).toBe(ERROR_STATUS);
            expect(withInvalidUsername.code).toBe("23503");

            const { body: withInvalidGroupId } = await addUserToGroup(testuser3.username, ctrlholtdel.token, "invalid-group", 400)
            expect(withInvalidGroupId.status).toBe(ERROR_STATUS);
            expect(withInvalidGroupId.message).toBe(restrictedError.message);

            const { body: validGroupNoUser } = await addUserToGroup("", ctrlholtdel.token, user1Group1.id, 400)
            expect(validGroupNoUser.status).toBe(ERROR_STATUS);
            expect(validGroupNoUser.message).toBe(CANNOT_PROCESS_REQUEST);
        });

        it('Validates the user if there is a pre-existing request', async () => {
            const { body: user3Request } = await request(app).post(`/groups/join?group_id=${user1Group1.id}`).set(AUTHORIZATION_HEADER, `Bearer ${testuser3.token}`).expect(201)
            expect(user3Request.status).toBe(SUCCESS_STATUS);
            
            const { body: validatedUser } = await addUserToGroup(testuser3.username, ctrlholtdel.token, user1Group1.id, 201)
            expect(validatedUser.status).toBe(SUCCESS_STATUS);
            expect(validatedUser.data.message).toBe(`${testuser3.username} added`);
        });

        it.only('If a user is an admin of a group they can add users to that group', async () => {
            // TODO: Test this - user is not an administrator so shouldn't be able to add users
            await setUserToAdmin(testuser2.username, ctrlholtdel.token, user1Group1.id)
            const { body: adminCheck } = await getGroups(ctrlholtdel.token)
            console.log(adminCheck.data.groups[0].users);


            const { body: groupsBeforeAdding } = await getGroups(testuser2.token)
            expect(groupsBeforeAdding.data.groups[0].users).toHaveLength(3)

            const { body: addingUserAsNotAdmin } = await addUserToGroup(testuser3.username, testuser2.token, user1Group1.id)
            expect(addingUserAsNotAdmin.status).toBe(SUCCESS_STATUS);

            const { body: groupsAfterAdding } = await getGroups(testuser2.token)
            expect(groupsAfterAdding.data.groups[0].users).toHaveLength(4)
            expect(groupsAfterAdding.data.groups[0].users.some(user => user.username === testuser3.username)).toBeTruthy()
        })
    });

})

describe('Players', () => {     
    describe('GET::/players/:groupId', () => {
        it('GET: Returns a list of all players at that specific group', async () => {
            const { body: playersListGroup1 } = await getPlayersList(user1Group1.id, ctrlholtdel.token)
            
            expect(playersListGroup1.status).toBe(SUCCESS_STATUS);
            expect(playersListGroup1.data.players.length).toBe(3);
        });

        it('Returns an error if you\'re not a member of the group', async () => {
            const { body: notValidated } = await getPlayersList(user1Group1.id, testuser3.token, 400)
            expect(notValidated.status).toBe(ERROR_STATUS);
            expect(notValidated.message).toBe(restrictedError.message);    
        });

        it('Returns a list of players if you\'re a member of the group', async () => {
            const { body: playersListValidatedUser } = await getPlayersList(user1Group1.id, testuser2.token)
            
            expect(playersListValidatedUser.status).toBe(SUCCESS_STATUS);
            expect(playersListValidatedUser.data.players.length).toBe(3);
            
        });

        it('Returns an error if the id is malformed', async () => {
            const { body: malformedId } = await getPlayersList('invalid-group-id', ctrlholtdel.token, 400)

            expect(malformedId.status).toBe(ERROR_STATUS);
            expect(malformedId.message).toBe(restrictedError.message);  
        });

        it('E2E: Returns an error if the user has no access to the group', async () => {
            const newUser = await newUserSetup("newUser")

            const { body: playersListGroup1Unvalidated } = await getPlayersList(user1Group1.id, newUser.token, 400) 
            expect(playersListGroup1Unvalidated.status).toBe(ERROR_STATUS);
            expect(playersListGroup1Unvalidated.message).toBe(restrictedError.message);
    
            await request(app).post(`/groups/join?group_id=${user1Group1.id}`).set(AUTHORIZATION_HEADER, `Bearer ${newUser.token}`).expect(201)
            const { body: playersListGroup1UnvalidatedAfterRequest } = await getPlayersList(user1Group1.id, newUser.token, 400)
            expect(playersListGroup1UnvalidatedAfterRequest.status).toBe(ERROR_STATUS);
            expect(playersListGroup1UnvalidatedAfterRequest.message).toBe(restrictedError.message);    

            const { body: addedResponse } = await addUserToGroup(newUser.username, ctrlholtdel.token, user1Group1.id, 201)
            expect(addedResponse.status).toBe(SUCCESS_STATUS);
            expect(addedResponse.data.message).toBe(`${newUser.username} added`);

            const { body: playersListGroup1AfterValidation } = await getPlayersList(user1Group1.id, newUser.token)
            expect(playersListGroup1AfterValidation.status).toBe(SUCCESS_STATUS);
            expect(playersListGroup1AfterValidation.data.players).toHaveLength(3);    
        })

        describe('Works with pagination and searching', () => {           
            it('Works with pagniation', async () => {
                for (let index = 0; index < 10; index++) {
                    await addPlayer(user1Group1.id, ctrlholtdel.token, `New Test Player - ${index}`)
                }
                const { body: playersListPaginatedDefault } = await getPlayersList(user1Group1.id, ctrlholtdel.token, null)
                expect(playersListPaginatedDefault.data.players).toHaveLength(10);

                const { body: playersListPaginatedSpecific } = await getPlayersList(user1Group1.id, ctrlholtdel.token, null, 3)
                expect(playersListPaginatedSpecific.data.players).toHaveLength(3);
            });

            it('Works with search and exact match', async () => {
                for (let index = 0; index < 5; index++) await addPlayer(user1Group1.id, ctrlholtdel.token, `search-me - ${index}`)
                await addPlayer(user1Group1.id, ctrlholtdel.token, `r`)

                const { body: playersListPaginatedDefault } = await getPlayersList(user1Group1.id, ctrlholtdel.token, null, null, encodeURIComponent('search-me'))
                expect(playersListPaginatedDefault.data.players).toHaveLength(5);

                const { body: playersListWithExactMatch } = await getPlayersList(user1Group1.id, ctrlholtdel.token, null, null, 'r')
                expect(playersListWithExactMatch.data.players).toHaveLength(9);
                expect(playersListWithExactMatch.data.players[0].name).toBe('r');
                expect(playersListWithExactMatch.data.players[0].exactMatch).toBeTruthy()
            })

            it('Returns an error if limit is not a number', async () => {
                const { body: invalidLimit } = await getPlayersList(user1Group1.id, ctrlholtdel.token, 400, "invalid-limit")
                expect(invalidLimit.status).toBe(ERROR_STATUS);
                expect(invalidLimit.message).toBe(CANNOT_PROCESS_REQUEST);
            })
        })

        describe('Works with URI Encoding', () => {
            it('Works with characters that need to be escaped', async () => {        
                const playerName = '##//####a\\##player==!!dl'
                const { body: responseFromEncodedAddedUser } = await addPlayer(user1Group1.id, ctrlholtdel.token, encodeURIComponent(playerName))
                expect(responseFromEncodedAddedUser.data.addedPlayer.name).toBe(playerName);
            });
        });
    });

    describe('POST::/players/:groupId', () => {
        const newPlayerName = 'new_player'

        it('Admin can add a new player to the group', async () => {
            const { body: initialPlayersListGroup } = await getPlayersList(user1Group1.id, ctrlholtdel.token)
            expect(initialPlayersListGroup.status).toBe(SUCCESS_STATUS);
            expect(initialPlayersListGroup.data.players).toHaveLength(3);
            const { body: addedPlayer } = await addPlayer(user1Group1.id, ctrlholtdel.token, newPlayerName, 201)
            expect(addedPlayer.status).toBe(SUCCESS_STATUS);
            expect(addedPlayer.data.addedPlayer.name).toBe(newPlayerName);

            const { body: afterPlayersListGroup } = await getPlayersList(user1Group1.id, ctrlholtdel.token)
            expect(afterPlayersListGroup.status).toBe(SUCCESS_STATUS);
            expect(afterPlayersListGroup.data.players).toHaveLength(4);
        })

        it('Validated Users can add a new player', async () => {
            const { body: addedByTestUser } = await addPlayer(user1Group1.id, testuser2.token, newPlayerName, 201)
            expect(addedByTestUser.data.addedPlayer.name).toBe(newPlayerName);
        });

        it('Users not within the group can\'t add a player', async () => {
            const { body: unvalidatedUserPlayerAdd } = await addPlayer(user1Group1.id, testuser1.token, newPlayerName, 400)
            expect(unvalidatedUserPlayerAdd.status).toBe(ERROR_STATUS);
            expect(unvalidatedUserPlayerAdd.message).toBe(restrictedError.message);

            const { body: unvalidatedUserPendingRequestPlayerAdd } = await addPlayer(user1Group1.id, testuser3.token, newPlayerName, 400)
            expect(unvalidatedUserPendingRequestPlayerAdd.status).toBe(ERROR_STATUS);
            expect(unvalidatedUserPendingRequestPlayerAdd.message).toBe(restrictedError.message);

        });

       it('Returns an error if trying to add a duplicate player', async () => {
            const { body: firstAdd } = await addPlayer(user1Group1.id, ctrlholtdel.token, newPlayerName, 201)
            expect(firstAdd.status).toBe(SUCCESS_STATUS);

            const { body: secondAdd } = await addPlayer(user1Group1.id, ctrlholtdel.token, newPlayerName, 500)
            expect(secondAdd.status).toBe(ERROR_STATUS);
            expect(secondAdd.message).toBe('No Duplicate Values');
       });

       it('Throws an error if trying to add a user to a non-existent group', async () => {
            const { body: invalidGroupName } = await addPlayer("invalid-group-id", ctrlholtdel.token, newPlayerName, 400)
            expect(invalidGroupName.status).toBe(ERROR_STATUS);
            expect(invalidGroupName.message).toBe(restrictedError.message);
       });

       it('Cant add an empty value as a player name', async () => {
            const { body: undefinedPlayerName } = await addPlayer(user1Group1.id, ctrlholtdel.token, undefined, 400)
            expect(undefinedPlayerName.status).toBe(ERROR_STATUS);
            expect(undefinedPlayerName.message).toBe("Name cannot be a null value");

            const { body: emptyStringPlayerName } = await addPlayer(user1Group1.id, ctrlholtdel.token, "", 400)
            expect(emptyStringPlayerName.status).toBe(ERROR_STATUS);
            expect(emptyStringPlayerName.message).toBe("Name cannot be a null value");
       });
    });

    describe('PUT::/players/:groupId', () => { 
        let playerName = 'Test Player'
        const updatedType = 'new type'
        let addedPlayer;

        beforeEach(async () => {
            const { body: initialPlayer } = await addPlayer(user1Group2.id, ctrlholtdel.token, playerName)
            addedPlayer = initialPlayer            
        })

        it('Can update the type of a player', async () => {
            const { body } = await request(app).put(`/players/${user1Group2.id}/${addedPlayer.data.addedPlayer.id}`).send({ type: updatedType }).set(AUTHORIZATION_HEADER, `Bearer ${ctrlholtdel.token}`).expect(201)
            expect(body.status).toBe(SUCCESS_STATUS);
            expect(body.data.updatedPlayer.type).toBe(updatedType);
            expect(body.data.updatedPlayer.name).toBe(playerName);
        });

        it('User without group access can\'t update player', async () => {
            const { body } = await request(app).put(`/players/${user1Group2.id}/${addedPlayer.data.addedPlayer.id}`).send({ type: updatedType }).set(AUTHORIZATION_HEADER, `Bearer ${testuser3.token}`).expect(400)                
            expect(body.status).toBe(ERROR_STATUS);
            expect(body.message).toBe(restrictedError.message);
        });
    })
})

describe('Notes', () => {

    let player1;
    let notesListPlayer1;

    beforeEach( async () => {
        const { body: players } = await getPlayersList(1, ctrlholtdel.token)
        player1 = players.data.players[0]
        const { body: notesResponse } = await getNotes(player1.id, ctrlholtdel.token)
        notesListPlayer1 = notesResponse.data.notes
    })

    describe('GET::/notes/:player_id', () => {
        it('Should return all notes/tendencies on a user', async () => {
            const { body: notesResponse } = await getNotes(player1.id, ctrlholtdel.token)
            expect(notesResponse.status).toBe(SUCCESS_STATUS);
            expect(notesResponse.data.notes).toHaveLength(3);
            expect(notesResponse.data.tendencies).toHaveLength(1);
            expect(notesResponse.data.player).toMatchObject({
                created_by: "ctrlholtdel",
                created_time: expect.any(String),
                id: "1",
                name: "player 1",
                note_group_id: "1",
                type: null, 
            })
        });

        it('Users without access shouldn\'nt be able to get the notes', async () => {
            const { body: notesResponseNoAccess } = await getNotes(player1.id, testuser3.token, 400)
            expect(notesResponseNoAccess.status).toBe(ERROR_STATUS);
        });

        it('Errors correctly if trying to access a non-existent player', async () => {
            const { body: notesResponseInvalidUser } = await getNotes("not-a-real-id", testuser1.token, 400)
            expect(notesResponseInvalidUser.status).toBe(ERROR_STATUS);
            expect(notesResponseInvalidUser.message).toBe(restrictedError.message);
        });
    });

    describe('POST::/notes/:player_id', () => { 
        it('User can add notes to players', async () => {
            const newNote = { note: "This is a new note", type: "note" }
            const { body: addedNote } = await addNote(player1.id, ctrlholtdel.token, newNote)
            expect(addedNote.status).toBe(SUCCESS_STATUS);
            expect(addedNote.data.addedNote).toMatchObject({ 
                id: expect.any(String), 
                created_by: ctrlholtdel.username,
                note: newNote.note,
                type: newNote.type,
                player_id: player1.id
            });


            const { body: updatedNotes } = await getNotes(player1.id, ctrlholtdel.token, 200)

            expect(updatedNotes.data.notes).toHaveLength(4);
            expect(updatedNotes.data.notes[updatedNotes.data.notes.length - 1].note).toBe(newNote.note);

        });

        it('Can\'t add an empty note', async () => {
            const { body: emptyAddedNote } = await addNote(player1.id, ctrlholtdel.token,  { note: "", type: "note" }, 400)
            expect(emptyAddedNote.status).toBe(ERROR_STATUS);
            expect(emptyAddedNote.message).toBe(CANNOT_PROCESS_REQUEST);

            const { body: noteMissingBodyAdded } = await addNote(player1.id, ctrlholtdel.token, { type: "note" }, 400)
            expect(noteMissingBodyAdded.status).toBe(ERROR_STATUS);
            expect(noteMissingBodyAdded.message).toBe(CANNOT_PROCESS_REQUEST);
        });

        it('Can\'t add a note with an invalid type', async () => {
            const { body: noteNoType } = await addNote(player1.id, ctrlholtdel.token, { note: "note here!" }, 400)
            expect(noteNoType.status).toBe(ERROR_STATUS);
            expect(noteNoType.message).toBe(CANNOT_PROCESS_REQUEST);

            const { body: noteInvalidType } = await addNote(player1.id, ctrlholtdel.token, { note: "note here!", type: "Invalid Type!" }, 400)
            expect(noteInvalidType.status).toBe(ERROR_STATUS);
            expect(noteInvalidType.message).toBe(CANNOT_PROCESS_REQUEST);
        });

        it('Unauthenticated users can\'t add a note', async () => {
            const { body: noteFromUnauthenticated } = await addNote(player1.id, testuser3.token, { note: "Trying to add a note to a player I don't have access to", type: "note" }, 400)
            expect(noteFromUnauthenticated.status).toBe(ERROR_STATUS);
            expect(noteFromUnauthenticated.message).toBe(restrictedError.message);
        });
    })

})