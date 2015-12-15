var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {  user: req.user });
});


router.get('/login', function(req, res, next){
	res.render('login');
});

router.post('login', passport.authenticate('local'), function(req, res){
	
	res.redirect('/');
});


router.get('/register', function(req, res, next){
	res.render('register', { });
});

router.post('/register', function(req, res, next){
	Account.register(new Account(
	{username: req.body.username}),
	req.body.password,
	function(error, account){
		if (error){
			console.log(error);
			return res.render('register');
		}else{
			passport.authenticate('local')(req, res, function(){
				req.session.username = req.body.username;
				res.redirect('/')
			})
		}
	});
});

function isLoggedIn(req, res, next){

}








module.exports = router;
