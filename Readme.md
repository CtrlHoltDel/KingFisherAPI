# Endpoints

## Auth

### POST
/auth/register
body || { username: "string", password: "string" }
response.data || { username: 'string', created_time: 'date' }

### POST
/auth/login
body || { username: "string", password: "string" }
response.data || { token: "string", username: "string" }

## Groups

### GET