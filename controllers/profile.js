// Selects user information for profile view
export const handleProfileGet = (req, res, db) => {
    const { id } = req.params;
    db.select('*').from('users').where({ id })
        .then(user => {
            if (user.length) {
                res.json(user[0]);
            } else {
                res.status(400).json('not found');
            }
        })
        .catch(err => res.status(400).json('error getting user'));
};

// Updates information in DBs when user updates name, email, or pronouns on profile
export const handleProfileUpdate = (req, res, db) => {
    const { id } = req.params;
    const { name, email, pronouns } = req.body.formInput;
    
    db.transaction(async (trx) => {
        try {
            if (name) {
                await trx('users')
                    .where({ id })
                    .update({ name });
            }

            if (email) {
                const currentUser = await trx('users')
                    .select('email')
                    .where({ id })
                    .first();

                if (!currentUser) {
                    throw new Error('User not found');
                }

                const currentEmail = currentUser.email;

                await trx('users')
                    .where({ id })
                    .update({ email });

                await trx('login')
                    .where({ email: currentEmail })
                    .update({ email });
            }

            if (pronouns) {
                await trx('users')
                    .where({ id })
                    .update({ pronouns });
            }

            await trx.commit();
            res.json('Profile updated successfully');
        } catch (err) {
            await trx.rollback();
            console.error(err);
            res.status(400).json('Error updating profile');
        }
    });
};