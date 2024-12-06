import express  from 'express';
import * as bcrypt from 'bcrypt-nodejs';
import cors from 'cors';
import knex from 'knex';
import register from './controllers/register.js';
import { signinAuthentication } from './controllers/signin.js';
import { handleProfileGet, handleProfileUpdate } from './controllers/profile.js';
import { image, handleApiCall } from './controllers/image.js';
import { requireAuth } from './controllers/authorization.js';

// DB Connection
const db = knex({
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL
    }
  });


const app = express();
app.use(express.json());
app.use(cors());


app.get('/', (req, res) => { res.send('It is working!')});

// Check sign in function w/ DB + give them a token
app.post('/signin', signinAuthentication(db, bcrypt));

// Register user to DB + give them a token
app.post('/register', (req, res) => { register(req, res, db, bcrypt)});

// Getting user profile information
app.get('/profile/:id', requireAuth, (req, res) => { handleProfileGet(req, res, db)});
app.post('/profile/:id', requireAuth, (req, res) => { handleProfileUpdate(req, res, db)});

// Increments entry count with each image send
app.put('/image', requireAuth, (req, res) => { image(req, res, db)});

// Clarifai API
app.post('/imageurl', requireAuth, (req, res) => { handleApiCall(req, res)});

// Server port running
app.listen(process.env.PORT || 3001, '0.0.0.0', () => {
    console.log('app is running on port `${process.env.PORT} ` or 3001');
})


/*
/ --> res = this is working
/signin --> POST = success/fail
/register --> POST = user
/profile/:userId --> GET = user
/image --> PUT = user

*/