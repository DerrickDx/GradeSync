var mongoose = require('mongoose');

mongoose.connect('mongodb+srv://group21:password213@cluster0-5x1ar.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});
// mongoose.connect('mongodb+srv://dbUser:13802958513@cluster0-wjdrz.mongodb.net/test?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});

const schedule = require('node-schedule');

const canvasCall = require("./canvas-call");
const websubCall = require("./websub-call");

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
});


//creating schema
var scheduleSchema = new mongoose.Schema({
    websubDir: String,
    canvasDir: String,
    frequency: String,
    startDate: Date,
    endDate: String,
    token: String

  });


//creating model
var scheduleModel = mongoose.model('schedule', scheduleSchema);


function findSchedule(callback, query) {
    // let endDate = query.endDate;
    // let time = query.time;
    let canvasDir = query.myuniDir;
    let websubDir = query.websubDir;

    // console.log(canvasDir+' '+websubDir);
    scheduleModel.find({canvasDir:canvasDir, websubDir:websubDir}, {canvasDir: 1, websubDir: 1, frequency: 1, endDate: 1}, function(error, result){
        if(error) {
            console.log(error);
            callback('0');
        } else {
            if (result.length > 0) {
                callback(result[0]);
            } else {
                callback('0');
            }
        }
    });
}

function deleteSchedule(callback, query) {
    // let endDate = query.endDate;
    // let time = query.time;
    let canvasDir = query.myuniDir;
    let websubDir = query.websubDir;

    // console.log(canvasDir+' '+websubDir);
    scheduleModel.deleteOne({canvasDir:canvasDir, websubDir:websubDir},  function(error, result){
        if(error) {
            console.log(error);
            callback('0');
        } else {

            for (let i in schedule.scheduledJobs) {
                schedule.scheduledJobs[schedule.scheduledJobs[i].name].cancel();
            }
            scheduleFind();
            callback('1');

        }
    });
}

function setSchedule(callback, query) {
    // let endDate = query.endDate;
    // let time = query.time;
    let canvasDir = query.myuniDir;
    let websubDir = query.websubDir;
    let code = query.code;
    let endDate = query.endDate;
    let time = query.time;
    let frequency = query.frequency;
    let token = query.token;



    // console.log(canvasDir+' '+websubDir);

    var docCreate =  {
        websubDir:  websubDir,
        canvasDir: canvasDir,
        frequency: frequency,
        startDate: Date.now(),
        endDate: endDate,
        token : token
    }

    var docUpdate =  {
        frequency: frequency,
        endDate: endDate,
    }
    var conUpdate =  {
        websubDir:  websubDir,
        canvasDir: canvasDir,
    }

    if (code == 1 ){
        scheduleModel.update(conUpdate, docUpdate, function(error){
            if(error) {
                console.log(error);
                callback('0');
            } else {
                console.log('update ok!');
                for (let i in schedule.scheduledJobs) {
                    schedule.scheduledJobs[schedule.scheduledJobs[i].name].cancel();
                }
                scheduleFind();
                callback('1');
            }
        })
    } else {
        scheduleModel.find({canvasDir:canvasDir}, {canvasDir: 1, websubDir: 1, frequency: 1, endDate: 1}, function(error, result) {
            if (error) {
                console.log(error);
                callback('0');
            } else {

                if (result.length == 0) {
                    scheduleModel.create(docCreate, function (error) {
                        if (error) {
                            console.log(error);
                            callback('0');
                        } else {
                            console.log('create ok');
                            for (let i in schedule.scheduledJobs) {
                                schedule.scheduledJobs[schedule.scheduledJobs[i].name].cancel();
                            }
                            scheduleFind();
                            callback('1');
                        }

                    })
                } else {
                    callback('2');

                }
            }
        })
    }
}

function scheduleFind(){

    scheduleModel.find({}, {canvasDir: 1, websubDir: 1, frequency: 1, endDate: 1, token: 1}, function(error, result) {
        if (error) {
            console.log(error);
        } else {
            console.log(result);
            if (result.length > 0) {
                for (i in result) {

                    onSchedule(result[i])
                }
            }
        }
    })
}

function onSchedule(result){

    var counter = 1;

    let rule = new schedule.RecurrenceRule();

    // let array = [];
    // let num = 0;
    // while (num + parseInt(result.frequency, 10) <= 60) {
    //     num + result.frequency
    //     array.push(num + parseInt(result.frequency, 10));
    //     num = num + parseInt(result.frequency, 10);
    //
    // }
    //
    // rule.second = array;

    var myDate = new Date();


    let resultEndDate = result.endDate;
    let currentDate = myDate.toISOString().substring(0,10);

    if (parseInt(resultEndDate.substring(0,4)) <= parseInt(currentDate.substring(0,4))) {

        if (parseInt(resultEndDate.substring(5,7)) <= parseInt(currentDate.substring(5,7))) {
            if (parseInt(resultEndDate.substring(8,10)) < parseInt(currentDate.substring(8,10))) {

                scheduleModel.deleteOne({canvasDir:result.canvasDir},  function(error, result){
                    if(error) {
                        console.log(error);
                        callback('0');
                    } else {

                        for (let i in schedule.scheduledJobs) {
                            schedule.scheduledJobs[schedule.scheduledJobs[i].name].cancel();
                        }
                        scheduleFind();

                    }
                });
            }
        }
    }

    let array = [];
    let num = 0;
    array.push(0);
    while (num + parseInt(result.frequency, 10) <= 24) {
        num + result.frequency
        array.push(num + parseInt(result.frequency, 10));
        num = num + parseInt(result.frequency, 10);

    }

    rule.hour = array;
    rule.minute = 0;
    const j = schedule.scheduleJob(rule, function(){

        let remotePath = result.websubDir;
        let fields = {};

        fields.courseId = (result.canvasDir.split('/'))[0];
        fields.assignmentId = (result.canvasDir.split('/'))[1];
        fields.token = result.token;

        websubCall.getFile(function (filePath) {
            // use function callCanvasAPI in canvas-call.js
            canvasCall.callCanvasAPI( fields, filePath);
        }, remotePath);
        counter++;

    });
}

scheduleFind();


//note that we are exporting the model (called bookmodel) here 
module.exports = {
    findSchedule, setSchedule, deleteSchedule
}
