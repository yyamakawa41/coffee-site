

var express = require('express');
var passport = require('passport');
//Require our account.js file which resides in models one dir up
var Account = require('../models/account');
var router = express.Router();
var nodemailer = require('nodemailer');
var vars = require('../config/vars.json');
var stripe = require('stripe')("sk_test_5yxP4OcPQfyQeHfXuWjRYmfA");
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
            res.render('/choices', { username : req.session.username });
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
        res.redirect('/');
    }
    //req.query.login pulls the query parameters right out of the http headers!
    //They are here and failed a login
    if (req.query.failedlogin){
        res.render('login', { failed : "Your username or password is incorrect." });    
    }
    //They are here and aren't logged in
    res.render('login', { user : req.user });
});

router.post('/login', function (req, res, next){
    passport.authenticate('local', function (err, user, info){
        if(err){
            return next(err);
        }

        if(!user){
            return res.redirect('login?failedlogin=1');
        }
        if(user){
            console.log(user);
            passport.serializeUser(function (user, done){
                done(null, user);
            });
            passport.deserializeUser(function (obj, done){
                done(null, obj);
            });
            req.session.username = user.username;
            console.log(req.session.username);
        }
        return res.redirect('/choices')

    })(req, res, next);
});

/* ---------------------------- */
/* ----------Logout----------- */
/* ---------------------------- */
router.get('/logout', function(req, res) {
    req.logout();
    req.session.destroy();
    res.redirect('/');
});

router.get('/choices', function (req, res, next){
  //Check to see if user is logged in
    if(!req.session.username){
        res.redirect('/login');
    }
    else{
        //Check to see if they have preferences already
        Account.findOne({username: req.session.username},
            function (err, doc){
                var currGrind = doc.grind ? doc.grind : undefined
                var currPounds = doc.pounds ? doc.pounds : undefined
                var currFrequency = doc.frequency ? doc.frequency : undefined
                console.log(currGrind)
                console.log(currFrequency)

                res.render('choices', { user: req.session.username,
                                        active: 'options',
                                        grind: currGrind,
                                        pounds: currPounds,
                                        frequency: currFrequency
                                      });

            });
    }
  
});

router.post('/choices', function (req, res, next){
    //Are they logged in
    if(!req.session.username){
        res.redirect('/login');
    }
    else{
        var newGrind = req.body.grind;
        var newFrequency = req.body.frequency;
        var newPounds = req.body.pounds;

        var update = {grind: newGrind, frequency: newFrequency, pounds: newPounds};

        Account.findOneAndUpdate(
        {username: req.session.username},
        update, 
        {upsert: true},
        function (err, account){
            if (err){
                res.send('There was an error saving your preferences. Please re-enter your order details. ERROR: '+err)

            }else{
                account.save;
            }
        });
        res.redirect('/delivery');
    }
});

router.get('/delivery', function (req, res, next){
    if(!req.session.username){
        res.redirect('/login');
    }else{
        Account.findOne({username: req.session.username},
            function (err, doc){
                var currAddr1 = doc.addressLine1 ? doc.addressLine1 : ''
                var currAddr2 = doc.addressLine2 ? doc.addressLine2 : ''
                var currFullName = doc.fullName ? doc.fullName : ''
                var currCity = doc.city ? doc.city : ''
                var currState = doc.state ? doc.state : ''
                var currZipCode = doc.zipCode ? doc.zipCode : ''
                var currDeliveryDate = doc.deliveryDate ? doc.deliveryDate : ''
                res.render('delivery', {user: req.session.username,
                                        active: 'delivery',
                                        fullName: currFullName,
                                        addressLine1: currAddr1,
                                        addressLine2: currAddr2,
                                        city: currCity,
                                        state: currState,
                                        zipCode: currZipCode,
                                        deliveryDate: currDeliveryDate
                                        });
            });
        

    }
});

router.post('/delivery', function (req, res, next){
    if(!req.session.username){
        res.redirect('/login');
    }
    else{
        var newFullName = req.body.fullName
        var newAddressLine1 = req.body.addressLine1
        var newAddressLine2 = req.body.addressLine2
        var newCity = req.body.city
        var newState = req.body.state
        var newZipCode = req.body.zipCode
        var newDeliveryDate = req.body.deliveryDate

        var update = {  
                        fullName: newFullName,
                        addressLine1: newAddressLine1,
                        addressLine2: newAddressLine2,
                        city: newCity,
                        state: newState,
                        zipCode: newZipCode,
                        deliveryDate: newDeliveryDate
                     }

        Account.findOneAndUpdate({username: req.session.username},
            update,
            {upsert: true},
            function (err, account){
                if (err){
                    res.send('There was an error saving your preferences. Please re-enter your order details. ERROR: '+err)
                }else{
                    account.save;
                }
        });
        res.redirect('/')

    }
});


router.get('/email', function ( req, res, next){
  var transporter = nodemailer.createTransport({
    service: "Gmail", 
    auth: {
      user: vars.email,
      pass: vars.password
    }
  });
  var text = "This is a test email sent from my node server";
  var mailOptions = {
    from: 'Yohsuke Yamakawa <yyamakawa@gmail.com>',
    to: 'Yohsuke Yohsuke <yyamakawa@gmail.com',
    subject: 'This is a test subject',
    text: text
  }

  transporter.sendMail(mailOptions, function(error, info){
    if(error){
      console.log(error);
      res.json({response: error});
    }else{
      console.log("Message was successfully sent, Response was " + info.response);
      res.json({response: "success"});
    }
  })
});


router.get('/payment', function (req, res, next){
    //If the user is logged in...
    if(req.session.username){
        Account.findOne({ "username": req.session.username}, function (err, doc, next){
            var fullName = doc.fullName ? doc.fullName : undefined;
            var address1 = doc.address1 ? doc.address1 : undefined;
            var address2 = doc.address2 ? doc.address2 : undefined;
            var city = doc.city ? doc.city : undefined;
            var state = doc.city ? doc.state : undefined;
            var zip = doc.zip ? doc.zip : undefined;
            var nextDelivery = doc.nextOrderDate ? doc.nextOrderDate : undefined
            res.render( 'payment', {
                username: req.session.username,
                fullName: fullName,
                address1: address1,
                address2: address2,
                city: city,
                state: state,
                zip: zip,
                nextDelivery: nextDelivery
            });
        });
    }    
    if(!req.session.username){
        //The user is not logged in. Send them to the login page.
        res.redirect('/login');
    }    
});


router.post('/payment', function (req, res, next){
  stripe.charges.create({
    amount: 400,
    currency: "usd",
    source: req.body.stripeToken,
    description: "Charge to " + req.body.stripeEmail
  }, function(err, charge){
    console.log(req.body)
    if(err){
      res.send('you got an error.' + err)
    }else{
      res.redirect('/thankyou')
    }
  });
});

router.get('/contact', function ( req, res, next){
  res.render('contact');
});


module.exports = router;
