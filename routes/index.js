

var express = require('express');
var passport = require('passport');
//Require our account.js file which resides in models one dir up
var Account = require('../models/account');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    //res.send(req.session);
    res.render('index', { username : req.session.username });
});

////////////////////////////////////////
////////////////REGISTER////////////////
////////////////////////////////////////

// Get the register page
router.get('/register', function(req, res) {
    res.render('register', { });
});

//Post to the register page
router.post('/register', function(req, res) {
    //The mongo statement to insert the new vars into the db
    Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
            return res.render('register', { err : err });
        }
        passport.authenticate('local')(req, res, function () {
            req.session.username = req.body.username;
            res.render('index', { username : req.session.username });
        });
    });
});

/* ---------------------------- */
/* ----------Login----------- */
/* ---------------------------- */
//Get the login page
router.get('/login', function(req, res) {

    //the user is already logged in
    if(req.session.username){
        res.redirect('/choices');
    }
    //req.query.login pulls the query parameters right out of the http headers!
    //They are here and failed a login
    if (req.query.failedlogin){
        res.render('login', { failed : "Your username or password is incorrect." });    
    }
    //They are here and aren't logged in
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
          return next(err); // will generate a 500 error
        }
        // Generate a JSON response reflecting authentication status
        if (! user) {
          return res.redirect('/login?failedlogin=1');
        }
        if (user){
            // Passport session setup.
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

/* ---------------------------- */
/* ----------Logout----------- */
/* ---------------------------- */
router.get('/logout', function(req, res) {
    req.session.destroy();
    res.redirect('/');
});

router.get('/choices', function (req, res, next){
  if(req.session.username){
    res.render('choices');
  }else{
    res.redirect('/');
  }
  
});

router.post('/choices', function (req, res, next){
  if(req.session.username){
    Account.findOne({username: req.session.username},
    function (err, doc){
      var grind = doc.grind;
      var frequency = doc.frequency;
      var pounds = doc.quarterPounds;

    });

     var newGrind =  req.body.grind;
     var newFrequency = req.body.frequency;
     var newPounds = req.body.pounds;

     Account.findOneAndUpdate(
      { username: req.session.username },
      { grind:newGrind },
      { upsert: true },
      function (err, account){
        if (err){
          res.send('There was an error saving your preferences. Please re-enter or send this error to the help team:' +err)
        }else{
          account.save;
        }
      }
    )
  }
});












module.exports = router;
