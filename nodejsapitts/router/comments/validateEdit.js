const Joi = require('joi')

const validComment = Joi.object().keys({
	text: Joi.string()
		.trim()
		.min(3)
		.max(80)
})

module.exports = validComment
