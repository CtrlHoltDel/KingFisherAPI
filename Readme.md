# Endpoints

## Auth

/auth/register
#### POST
body || { username: string, password: string }
response.data || { username: string, created_time: date }

/auth/login
#### POST
body || { username: "string", password: "string" }
response.data || { token: "string", username: "string" }

## Groups

/groups
### GET //Getting a list of all groups you belong to
body || null
response.data || { groups: [{ name: string, note_group: id, username: string, group: id }, {}, {}, ...]}

### POST //Creating a new group
body || { name: string }
response.data || { name: string, created_time: date }


/groups/join?id=id
### POST //Requests to join a group
body || { group_id: string }
response.data { message: string }

/groups/requests
### GET //Returns all your group requests
body || null
response.data { groupRequests: [ ]}