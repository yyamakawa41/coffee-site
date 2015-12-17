var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
	username: String,
	password: String, 
	grind: String,
	pounds: Number,
	frequency: String,
	fullName: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    zipCode: Number,
    deliveryDate: String
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);









