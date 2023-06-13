import express  from 'express';
import bodyParser from 'body-parser';
import * as bcrypt from 'bcrypt-nodejs';
import cors from 'cors';
import knex from 'knex';
import register from './controllers/register.js';
import signin from './controllers/signin.js';
import profile from './controllers/profile.js';
import pkg from './controllers/image.cjs';

const { image, handleApiCall } = pkg;

// DB Connection
const db = knex({
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL
    }
  });


const app = express();
app.use(bodyParser.json());
app.use(cors());


app.get('/', (req, res) => { res.send('it is working!')});

// Check sign in function w/ DB
app.post('/signin', (req, res) => { signin(req, res, db, bcrypt)});

// Register user to DB
app.post('/register', (req, res) => { register(req, res, db, bcrypt)});

// Selecting user entry count
app.get('/profile/:id', (req, res) => { profile(req, res, db)});

// Increments entry count with each image send
app.put('/image', (req, res) => { image(req, res, db)});

// Clarifai API
app.post('/imageurl', (req, res) => { handleApiCall(req, res)});

// Server port running
app.listen(process.env.PORT || 3000, () => {
    console.log('app is running on port `${process.env.PORT}`');
})


/*
/ --> res = this is working
/signin --> POST = success/fail
/register --> POST = user
/profile/:userId --> GET = user
/image --> PUT = user

*/