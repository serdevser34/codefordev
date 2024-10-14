const Joi = require('joi'),
	validateCreate = require('./validateCreate'),
	Comment = require('../../models/Comment')

const createComment = (req, res, next) =>
	Joi.validate(req.body, validateCreate, (err) => {
		if (err) return res.status(400).send({ error: err.details })

		const comment = new Comment(req.body);
		comment.commentedBy = req.authUser._id;
		comment.postID = req.commentsPost._id;

		comment.save(err => (err ? next(err) : res.json(comment)))
	})

module.exports = createComment
