var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose')

mongoose.connect('mongodb+srv://group21:password213@cluster0-5x1ar.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});

// mongoose.connect('mongodb+srv://dbUser:13802958513@cluster0-wjdrz.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
});


//creating schema
var userSchema = new mongoose.Schema({
    name: String,
    password: String,
    token: String
  });

//using the passportLocalMongoose on the schema
//this just adds a bunch of functions which makes it easy to use with passport
userSchema.plugin(passportLocalMongoose);

//creating model  
var userModel = mongoose.model('userModel', userSchema);




//note that we are exporting the model (called bookmodel) here 
module.exports = userModel;
