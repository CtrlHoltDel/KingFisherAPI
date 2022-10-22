# Endpoints

## Auth

#### POST
/auth/register
body || { username: string, password: string }
response.data || { username: string, created_time: date }

#### POST
/auth/login
body || { username: "string", password: "string" }
response.data || { token: "string", username: "string" }

## Groups

### GET //Getting a list of all groups you belong to
/groups
body || null
response.data || { groups: [{ name: string, note_group: id, username: string, group: id }, {}, {}, ...]}
### POST //Creating a new group

body || { name: string }
response.data || { name: string, created_time: date }


### POST //Requests to join a group
/groups/join?id=id
body || { group_id: string }
response.data { message: string }

### GET //Returns all your group requests
/groups/requests
body || null
response.data { groupRequests: [] }

### POST //Adds a user to a group you own
/groups/handle-request/:group_id?username=username
body || { action: 'string' } *Actions* add, update
response.data ||


## Players

### POST
/players/:group_id
body || null
response.data || { players: [] }

### POST
/players/:group_id/:player_name
body || null
response.data || { addedPlayer: 'string' }
