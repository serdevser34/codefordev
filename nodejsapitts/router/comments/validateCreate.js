const Joi = require('joi')
Joi.objectId = require('joi-objectid')(Joi)

const validComment = Joi.object().keys({
    followedCommentID: Joi.objectId()
        .allow(null),
	text: Joi.string()
		.trim()
		.min(3)
		.max(80)
})

module.exports = validComment