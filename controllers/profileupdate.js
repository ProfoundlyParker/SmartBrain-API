// Updates user profile information when name, email, or pronouns are updated
const handleProfileUpdate = (req, res, db) => {
    const { id } = req.params;
    const { name, email, pronouns } = req.body.formInput
    db('users')
        .where({ id })
        .update({
            ...(name && { name }),
            ...(email && { email }),
            ...(pronouns && { pronouns })
        })
        .then(resp => {
            if (resp) {
                res.json("Success")
            } else {
                res.status(400).json("Not Found")
            }
        })
        .catch(err => res.status(400).json('Error updating profile'))
}

export default handleProfileUpdate;