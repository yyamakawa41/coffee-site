var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
   if(req.session.username){
        res.redirect('/choices');
    }
    
    if (req.query.failedlogin){
        res.render('login', { failed : "Your username or password is incorrect." });    
    }
    
    res.render('login', { user : req.user });
}).post('/login', function(req, res, next) {

    if(req.body.getStarted){
        Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
            if (err) {
                return res.render('register', { err : err });
            }
            if(!err)
            passport.authenticate('local')(req, res, function () {
                req.session.username = req.body.username;
                res.render('choices', { username : req.session.username });
            });
        });        
    }

    if (!req.body.getStarted){
      passport.authenticate('local', function(err, user, info) {
        if (err) {
          return next(err); 
        }
        
        if (! user) {
          return res.redirect('/login?failedlogin=1');
        }
        if (user){
            
            passport.serializeUser(function(user, done) {
              console.log("serializing " + user.username);
              done(null, user);
            });

            passport.deserializeUser(function(obj, done) {
              console.log("deserializing " + obj);
              done(null, obj);
            });        
            req.session.username = user.username;
        }

        return res.redirect('/choices');
      })(req, res, next);
    }
});


router.get('/register', function(req, res, next){
	res.render('register', { });
});

router.post('/register', function(req, res, next){
	Account.register(new Account(
	{username: req.body.username}),
	req.body.password,
	function(err, account){
		if (err){
			console.log(error);
			return res.render('register', {err : err});
		}
		passport.authenticate('local')(req, res, function(){
				req.session.username = req.body.username;
				res.redirect('index', {username : req.session.username});
		});
	});
});

router.get('/logout', function(req, res) {
    req.logout();
    req.session.destroy();
    res.redirect('/');
});





module.exports = router;
