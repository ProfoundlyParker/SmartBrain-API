const handleProfileUpdate = (req, res, db) => {
    const { id } = req.params;
    const { name, age, pet } = req.body.formInput
    db('users')
        .where({ id })
        .update({ name })
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