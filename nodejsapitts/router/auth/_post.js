require('dotenv').config()
const jwt = require('jsonwebtoken'),
	Joi = require('joi'),
	validAuth = require('./validate'),
	User = require('../../models/User')

const authUser = (req, res, next) =>
	Joi.validate(req.body, validAuth, (err) => {
		if (err) return res.status(400).send({ error: err.details })

		User.findOne(req.body, { password: 0 }, (err, user) => {
			if (err) return next(err)
			if (!user) return res.status(404).send({ error: 'No such user' })

			const token = jwt.sign(
				{ user },
				process.env.SECRET_KEY,
				{ expiresIn: '1d' }
			)
			res.status(200).send({ token })
		})
	})

module.exports = authUser
