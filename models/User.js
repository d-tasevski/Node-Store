const mongoose = require('mongoose');
const md5 = require('md5');
const validator = require('validator');
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

mongoose.Promise = global.Promise;

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true, // User can't register with same account more than one time
        lowercase: true, // Saves email to your DB in lowercase letters
        trim: true,
        validate: [validator.isEmail, 'Invalid Email Address'], // Validator and error message
        required: 'Please supply an email address'
    },
    name: {
        type: String,
        required: 'Please supply a username',
        trim: true
    }
});

userSchema.virtual('gravatar').get(function () {
    const hash = md5(this.email);
    return `https://gravatar.com/avatar/${hash}?s=200`;
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model('User', userSchema);