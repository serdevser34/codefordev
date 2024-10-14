const Joi = require('joi'),
	validateEdit = require('./validateEdit'),
	Comment = require('../../models/Comment')

const updateComment = (req, res, next) =>
	Joi.validate(req.body, validateEdit, (err) => {
		if (err) return res.status(400).send({ error: err.details })

		Comment.findByIdAndUpdate(
			req.comment._id,
			req.body,
			{ new: true },
			(err, comment) => (err ? next(err) : res.json(comment))
		)
	})

module.exports = updateComment
