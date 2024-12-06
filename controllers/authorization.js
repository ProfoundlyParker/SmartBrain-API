import { redisClient } from './signin.js';

// function that requires authorization with a valid token to access certain endpoints
export const requireAuth = (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        return res.status(401).json('Unauthorized');
    }
    return redisClient.get(authorization, (err, reply) => {
        if (err || !reply) {
            return res.status(401).json('Unauthorized');
        }
        return next();
    })
}