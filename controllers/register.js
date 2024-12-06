// Registers users to database
import { setToken, signToken } from "./signin.js";

// Register endpoint - register users to DBs and gives them a token for session management
const register = async (req, res, db, bcrypt) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
        return res.status(400).json('incorrect form submission')
    }
    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
          hash: hash,
          email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
          return trx('users')
            .returning('*')
            .insert({
              email: loginEmail[0].email || loginEmail[0],
              name: name,
              joined: new Date()
            })
            .then(async user => {
                try {
                    // Generate and store token in Redis
                    const token = signToken(user[0].email);
                    await setToken(token, user[0].id);

                    res.json({ user: user[0], token });
                    } catch (err) {
                        console.error('Error storing token:', err);
                        res.status(500).json('Internal server error');
                    }
                });
        })
        .then(trx.commit)
        .catch(trx.rollback);
      })
      .catch(err => {
        console.error('Database transaction error:', err);
        res.status(400).json('Unable to register');
    });
}

export default register;