// Sign in function - checks correct email and PW from bcrypt
// Routes to home if user is found
import jwt from 'jsonwebtoken';
import redis from 'redis';

// set up Redis 
export const redisClient = redis.createClient({
    // host: '127.0.0.1',
    url: process.env.REDIS_URL,
    legacyMode: true,
});

// connect to Redis
async function redisConnect() {
    try {
        await redisClient.connect();
        console.log('Connected to Redis successfully');
    } catch (error) {
        console.error('Error connecting to Redis:', error);
    }
}

redisConnect();

// signs the user in, verifies email and password matches DB values
export const handleSignin = async (db, bcrypt, req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return Promise.reject('Incorrect form submission')
    }
    try {
        // Fetch email and hash from the login table
        const data = await db.select('email', 'hash').from('login').where('email', '=', email);

        if (data.length === 0) {
            return Promise.reject('Wrong credentials');
        }

        const isValid = bcrypt.compareSync(password, data[0].hash);

        if (isValid) {
            // Fetch user data
            const user = await db.select('*').from('users').where('email', '=', email);

            if (user.length === 0) {
                return Promise.reject('Unable to get user');
            }

            return user[0];
        } else {
            return Promise.reject('Wrong credentials');
        }
    } catch (err) {
        console.error('Error in handleSignin:', err);
        return Promise.reject('Error processing login');
    }
}

// Retrieves the token from Redis
const getAuthTokenId = (req, res) => {
    const { authorization } = req.headers;
    return redisClient.get(authorization, (err, reply) => {
        if (err || !reply) {
            return res.status(400).json('Unauthorized');
        } 
        return res.json({id: reply})
    })
}

// Signs the token so it's verified
export const signToken = (email) => {
    const jwtPayload = { email };
    return jwt.sign(jwtPayload, 'JWT_SECRET', { expiresIn: '2 days' })
}

// sets the token, and also removes it from Redis after 2 days, when it expires
export const setToken = async (key, value) => {
    return new Promise((resolve, reject) => {
        redisClient.setex(key, 2 * 24 * 60 * 60, value, (err, reply) => {
            if (err) {
                console.error('Error setting token in Redis:', err);
                return reject(new Error('Error storing token'));
            }
            resolve(reply);
        });
    });
}

// creates the session for the user
const createSessions = async (user) => {
    //JWT Token, return user data
    const { email, id } = user;
    const token = signToken(email);
    try {
        await setToken(token, id);
        return { success: 'true', userId: id, token };
    } catch (err) {
        console.error('Error creating session:', err);
        throw new Error('Error creating session');
    }
}

// sign in function with token authorization
export const signinAuthentication = (db, bcrypt) => async (req, res) => {
    const { authorization } = req.headers;
    try {
        if (authorization) {
            return getAuthTokenId(req, res);
        } else {
            const userData = await handleSignin(db, bcrypt, req, res);

            if (userData.id && userData.email) {
                const session = await createSessions(userData);
                return res.json(session);
            } else {
                return res.status(400).json('Invalid credentials');
            }
        }
    } catch (err) {
        console.error('Error in signinAuthentication:', err);
        return res.status(400).json(err.message || 'Unable to sign in');
    }
}