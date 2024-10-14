const Comment = require('../../models/Comment')

const getAllCommentsForPost = (req, res, next) => {
	Comment.find({ postID: req.commentsPost._id }, (err, comments) => (err ? next(err) : res.json(comments)))
}

module.exports = getAllCommentsForPost
