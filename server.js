const express = require('express')
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const path = require('path')

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const cors = require('cors')


const dbPath = path.join(__dirname, './loginDetails.db')

const app = express()
app.use(express.json())

const allowedOrigins = ['http://localhost:3001', 'https://klickks459.netlify.app'];

// CORS options
const corsOptions = {
    origin: allowedOrigins,
};

// Apply CORS to all routes
app.use(cors(corsOptions));

let db = null

//Initializing DB and Server 

const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        })


        app.listen(3000, () => console.log("Server Running Successfully!"))
    } catch (e) {
        console.log(`DB Error: ${e.message}`)
        process.exit(1)
    }
}

initializeDBAndServer()



//Register A User API

app.post("/signup", async (request, response) => {
    const { email, password } = request.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `SELECT * FROM user WHERE email = '${email}';`;
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined) {
        const createUserQuery = `
        INSERT INTO 
          user (email, password) 
        VALUES 
          (
            "${email}",
            "${hashedPassword}" 
          )`;
        const dbResponse = await db.run(createUserQuery);
        const newUserId = dbResponse.lastID;
        response.status(201).json({ message: `Created new user with ID: ${newUserId}` });

    } else {
        response.status(400).json({ error: "User already exists" });
    }
});

//Login API 

app.post('/login', async (request, response) => {
    const { email, password } = request.body

    const queryToCheckUser = `
      SELECT *
      FROM user
      WHERE email = '${email}';
    `
    const dbUser = await db.get(queryToCheckUser)

    if (dbUser === undefined) {
        response.status(400).json({ error: 'Invalid user' });
    } else {
        const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
        if (isPasswordMatched) {
            const payload = { email: email }
            const jwtToken = jwt.sign(payload, 'SECRET')
            const responseObj = {
                jwt_token: jwtToken,
            }
            response.status(200).json(responseObj);
        } else {
            response.status(400).json({ error: 'Invalid password' });
        }
    }
})


