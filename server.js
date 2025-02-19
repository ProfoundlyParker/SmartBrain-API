import express  from 'express';
import * as bcrypt from 'bcrypt-nodejs';
import cors from 'cors';
import knex from 'knex';
import register from './controllers/register.js';
import { signinAuthentication } from './controllers/signin.js';
import { handleProfileGet, handleProfileUpdate } from './controllers/profile.js';
import { image, handleApiCall } from './controllers/image.js';
import { requireAuth } from './controllers/authorization.js';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv';

dotenv.config();

// DB Connection
const db = knex({
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL
    }
  });

  const handleProfilePicUpdate = async (req, res, db) => {
    const { userId, profilePicUrl } = req.body;
    if (!userId || !profilePicUrl) {
      return res.status(400).json({ error: "Missing userId or profilePicUrl" });
    }
  
    try {
      const result = await db("users")
        .where({ id: userId })
        .update({ profile_pic: profilePicUrl })
        .returning("*");
  
      if (result.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.json({ success: true, updatedUser: result[0] });
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ error: "Database error" });
    }
  };
  
  const handleGetUserProfile = async (req, res, db) => {
    const userId = parseInt(req.query.userId, 10);
    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }
  
    try {
      const result = await db("users")
        .where({ id: userId })
        .select("profile_pic");
  
      if (result.length > 0) {
        res.json({ profilePicUrl: result[0].profile_pic });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Database fetch error:", error);
      res.status(500).json({ error: "Failed to fetch profile picture" });
    }
  };  


const app = express();
app.use(express.json());
app.use(cors());

const s3 = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// API Endpoint to Generate Pre-Signed URL
app.get("/get-upload-url", async (req, res) => {
  const { fileName, fileType } = req.query;

  if (!fileName || !fileType) {
    return res.status(400).json({ error: "Missing fileName or fileType in query" });
  }

  const params = {
    Bucket: process.env.BUCKET,
    Key: `profile-pictures/${fileName}`,
    ContentType: fileType,
  };

  try {
    const command = new PutObjectCommand(params);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // Expires in 1 hour
    res.json({ url });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    res.status(500).json({ error: "Failed to generate pre-signed URL" });
  }
});

app.post("/update-profile-pic", (req, res) => {
  handleProfilePicUpdate(req, res, db);
});

app.get("/get-user-profile", (req, res) => {
  handleGetUserProfile(req, res, db);
});


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
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log(`App is running on port '${port}' || 8080`);
});

/*
/ --> res = this is working
/signin --> POST = success/fail
/register --> POST = user
/profile/:userId --> GET = user
/image --> PUT = user

*/