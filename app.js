const express = require('express')
const app = express()
const formidable = require('formidable');
const port = 3000
const axios = require('axios');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM(`<!DOCTYPE html>`);
const $ = require('jQuery')(window);
const bodyParser = require("body-parser")

var userModel = require('./user.js')    //added usermodel

app.use(bodyParser.urlencoded({ extended: true }))


const canvasUrl = "https://myuni.adelaide.edu.au/api/v1/";

const canvasCall = require("./canvas-call");
const websubCall = require("./websub-call");
const user = require("./user");
const scheduleCall = require("./schedule");

const passport = require('passport')

const LocalStrategy = require("passport-local") //used for the local strategy

const mongoose = require('mongoose')

//setting up express session
app.use(require("express-session")({
  secret: "rusty is the best",
  resave: false,
  saveUninitialized: false
}))


//setting passport up
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(user.authenticate()));
passport.serializeUser(user.serializeUser());
passport.deserializeUser(user.deserializeUser());


var tokenVar = "not assigned";


//set viewing engine to ejs
app.set('view engine', 'ejs');

//this allows using the public folder which contains CSS and images
app.use(express.static(__dirname + '/public'));


// app.get('/', (req, res) => res.render('home',{
//     title : "GradeSync"
// }))

app.get('/', (req, res)=>{

    let isLoggedIn = '1';
    if (req.session.passport == undefined) {
        isLoggedIn = '0';
    }
    res.render('home', {
        isLoggedIn: isLoggedIn,
        title : "GradeSync"
    });
})

//=============UPLOAD FILES===========================================//
//get request to upload page
app.get('/upload', isLoggedIn, (req, res)=>{
    
    global.tokenVar;

    //code for finding logged in user

    var filter = {
      username:req.session.passport.user
    }

    //for finding token of the user
    var namefilter = userModel.find(filter);
    namefilter.exec(function(err,data){
      if(err) throw err;

      let token = data[0].token;
      loggedInId = data[0]._id;
      loggedinName = data[0].username;


      axios.get(canvasUrl + 'courses?access_token=' + token)
    // axios.get(canvasUrl + 'courses?access_token=' + tokenVar)
        .then(response => {

            var rd = response.data;

            websubCall.callWebSubYear(function (ret) {
                res.render('uploadpage', {
                    rt: ret,
                    rd: rd
                });
            })
        })
        .catch(error => {

            console.log('Sth wrong with the token');

            let result = [];
            let name = 'Access token invalid';
            let a = 'a';
            result.push({name: name, id: a});
            // let aa = JSON.stringify(result);
            websubCall.callWebSubYear(function (ret) {
                res.render('uploadpage', {
                    rt: ret,
                    rd: result
                });
            })
        });
    })
    
    
})

// to get a list of assignments for a given course
app.get('/api/getAssignmentList', isLoggedIn, (req, res) => {
    var filter = {
        username:req.session.passport.user
    }
    let courseId = req.query.courseId;

    //for finding token of the user
    var namefilter = userModel.find(filter);
    namefilter.exec(function(err,data){
        if(err) throw err;
        let token = data[0].token;

        axios.get(canvasUrl + 'courses/'+courseId + '/assignments?access_token=' + token)
            .then(response => {
                let rad = response.data;
                res.send(rad);
            })
            .catch(error => {
                console.log(error);
                res.send('Access token invalid');
            });
    })
})

app.get('/getWebSubSemesterList', (req, res) => {
    let year = req.query.year;
    let path = year;
    websubCall.callWebSubSemester(function (ret) {

        res.send(ret);

    }, path)
})

app.get('/getWebSubCourseList', (req, res) => {
    let year = req.query.year;
    let semester = req.query.semester;
    let path = year+'/'+semester;

    websubCall.callWebSubCourse(function (ret) {
        res.send(ret);
    }, path)
})

app.get('/getWebSubAssignmentList', (req, res) => {
    let year = req.query.year;
    let semester = req.query.semester;
    let course = req.query.course;
    let path = year+'/'+semester+'/'+course;
    websubCall.callWebSubAssignment(function (ret) {
        res.send(ret);
    }, path)
})

app.get('/getSchedule', (req, res) => {

    scheduleCall.findSchedule(function (ret) {
        res.send(ret);
    }, req.query);

})

app.get('/setSchedule', (req, res) => {
    var filter = {
        username:req.session.passport.user
    }


    //for finding token of the user
    var namefilter = userModel.find(filter);
    namefilter.exec(function(err,data) {
        if (err) throw err;
        req.query.token = data[0].token;
        scheduleCall.setSchedule(function (ret) {
            res.send(ret);
        }, req.query);
    })

})

app.get('/deleteSchedule', (req, res) => {

    scheduleCall.deleteSchedule(function (ret) {
        res.send(ret);
    }, req.query);

})

//post request to sync files

app.get('/sync', isLoggedIn, (req, res)=>{

    var filter = {
        username:req.session.passport.user
    }
    let courseId = req.query.courseId;


    //for finding token of the user
    var nameFilter = userModel.find(filter);

    nameFilter.exec(function(err1,data){
        if(err1) throw err1;

        // let remotePath = req.query.websubYear + '/' + req.query.websubSemester + '/' + req.query.websubCourse + '/' + req.query.websubAssignment;
        let remotePath = req.query.websubDir;
        websubCall.getFile(function (filePath) {

            let userToken = data[0].token;
            // use function callCanvasAPI in canvas-call.js
            canvasCall.callCanvasAPI(req.query, filePath, userToken, function (msg) {
                console.log('msg:'+msg);
                // if (msg == 'ok') {
                //     // res.redirect(303, '/thankyou');
                // } else {
                //     res.send(msg);
                // }
                res.send(msg);

            })
        }, remotePath);

    });

})

app.post('/synco', isLoggedIn, (req, res)=>{
    const form = new formidable.IncomingForm(); //creating an object of the formidable class

    var filter = {
        username:req.session.passport.user
    }
    let courseId = req.query.courseId;


    //for finding token of the user
    var namefilter = userModel.find(filter);

    form.parse(req, function (err, fields, files) {

        namefilter.exec(function(err1,data){
            if(err1) throw err1;

            let remotePath = fields.websubYear + '/' + fields.websubSemester + '/' + fields.websubCourse + '/' + fields.websubAssignment;

            websubCall.getFile(function (filePath) {

                fields.token = data[0].token;
                // use function callCanvasAPI in canvas-call.js
                canvasCall.callCanvasAPI(fields, filePath, function (msg) {
                    console.log('msg:'+msg);
                    if (msg == 'ok') {
                        res.redirect(303, '/thankyou');
                    } else {
                        res.send(msg);
                    }

                })
            }, remotePath);

        });
    });

})

// redirect to a thank you page
app.get('/thankyou', (req, res)=>{
    res.render('thankyou', {

    });

    // res.render('home', {
    //     isLoggedIn: isLoggedIn,
    //     title : "GradeSync"
    // });
})

app.post('/goback', (req, res)=>{

})

//================UPLOADING CODE ENDS==================================


//====================
//  AUTH ROUTES:
//====================
//register page route
app.get('/register', function (req, res) {
    res.render("register")
  })

//register handler
app.post('/register', function (req, res) {
    let token = req.body.token;
    if (token.length > 20) {

        user.register(new user({
            username: req.body.username,
            token: req.body.token
        }), req.body.password, function (err, user) {
            if (err) {
                console.log(err)
                res.render('register')
            }
            passport.authenticate('local')(req, res, function () {
                res.redirect("/upload");
            })
        })
    } else {
        res.send('Please enter the correct access token.');
        res.render('register')
    }
})

//login page route
app.get('/login', function (req, res) {
  res.render("login")
})

//login handler
app.post('/login', 
  passport.authenticate('local', 
  { failureRedirect: '/login', 
    successRedirect: "/upload" }),
  function(req, res) {
    
  });


//logout handler
app.get('/logout', function(req, res){
  req.logOut();
  res.redirect('/');
})


//custom middleware to check if user is logged in
function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next()
  }
  else
    res.redirect('/login')
}


app.get('/settings', isLoggedIn, (req, res) => {
    var filter = {
        username:req.session.passport.user
    }
    let courseId = req.query.courseId;

    //for finding token of the user
    var namefilter = userModel.find(filter);
    namefilter.exec(function(err,data){
        if(err) throw err;
        let token = data[0].token;
        res.render("settings", {tk: token, id: loggedInId, nm: loggedinName})
    })

})

app.post('/update', function(req, res, next) {

  
  var updateVar = userModel.findByIdAndUpdate(req.body.loggedID,{
    username: req.body.loggedName,
    token: req.body.loggedToken
    
  });  //create a variable from the model to invoke delete func on
  
  //we excecute the variable here.
  updateVar.exec(function(err,data){   
    if(err)
      throw err;
    else
      res.redirect("/login")
  }) 
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))