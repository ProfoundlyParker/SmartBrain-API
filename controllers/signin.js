// Sign in function - checks correct email and PW from bcrypt
// Routes to home if user is found
import jwt from 'jsonwebtoken';
import redis from 'redis';

// set up Redis
const redisClient = redis.createClient({host: 'localhost'});

export const handleSignin = (db, bcrypt, req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return Promise.reject('incorrect form submission')
    }
    return db.select('email', 'hash').from('login')
    .where('email', '=', email)
    .then(data => {
        const isValid = bcrypt.compareSync(password, data[0].hash);
        if (isValid) {
          return db.select('*').from('users')
            .where('email', '=', email)
            .then (user => user[0])
            .catch(err => Promise.reject('unable to get user'))
        } else {
            Promise.reject('wrong credentials')
        }
        
    })
    .catch(err => Promise.reject('wrong credentials'))
}

const getAuthTokenId = () => {
    console.log('auth okay');
}

const signToken = (email) => {
    const jwtPayload = { email };
    return jwt.sign(jwtPayload, 'JWT_SECRET', { expiresIn: '2 days' }) //replace with env variable
}

const createSessions = (user) => {
    //JWT Token, return user data
    const { email, id } = user;
    const token = signToken(email);
    return { success: 'true', userId: id, token }
}

export const signinAuthentication = (db, bcrypt) => (req, res) => {
    const { authorization } = req.headers;
    return authorization ? getAuthTokenId() : 
        handleSignin(db, bcrypt, req, res)
        .then(data => {
            return data.id && data.email ? createSessions(data) : Promise.reject(data)
        })
        .then(session => res.json(session))
        .catch(err => res.status(400).json(err))
}