const express = require('express'),
	router = express.Router(),
	authUser = require('./_post'),
	getMe = require('./_getMe'),
	ensureToken = require('./ensureToken')

router.route('/').post(authUser)

router.route('/user').get(ensureToken, getMe)

module.exports = router
