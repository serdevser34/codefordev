const likeComment = (req, res, next) => {
    const isLiked = req.comment.likes.some(l => l.toString() === req.authUser._id.toString())
    req.comment.likes = isLiked?
      [ ...req.comment.likes.filter(l => l.toString() !== req.authUser._id.toString()) ] :
      [ ...req.comment.likes, req.authUser._id ]

    req.comment.save((err) => {
        if (err) return next(err)
        res.json({ message: 'Successfully ' + (!isLiked? 'liked': 'disliked') })
    })
}

module.exports = likeComment;
