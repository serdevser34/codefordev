const deleteComment = (req, res) =>
	req.comment.remove(err => {
		return err
			? res.status(400).json({ error: 'No such comment' })
			: res.json({ message: 'Deleted successfully' })
	})

module.exports = deleteComment
