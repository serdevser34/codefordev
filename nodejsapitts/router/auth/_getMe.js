const getMyUser = (req, res) => res.json(req.authUser)

module.exports = getMyUser
