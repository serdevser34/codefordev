require("dotenv").config();
const jwt = require("jsonwebtoken"),
  User = require("../../models/User")

module.exports = function (req, res, next) {
  const bearerHeader = req.headers["authorization"]

  if (typeof bearerHeader === "undefined")
    return res.status(403).send({ error: "Unauthorized" })

  const bearer = bearerHeader.split(" ")[1]

  jwt.verify(bearer, process.env.SECRET_KEY, (err, decrypted) => {
    if (err) return res.status(403).send({ error: "Unauthorized" })

    User.findOne({ _id: decrypted.user._id }, { password: 0 }, (err, user) => {
      if (err || user === null)
        return res.status(403).send({ error: "No such user" })

      req.authUser = user
      next()
    })
  })
}
