const Joi = require('joi')

const validAuth = Joi.object().keys({
	email: Joi.string()
		.trim()
		.email()
		.required(),
	password: Joi.string()
		.trim()
		.min(5)
		.max(10)
		.required()
})

module.exports = validAuth
