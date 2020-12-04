const axios = require('axios');
const fs = require("fs");
const qs = require("qs");
const canvasUrl = "https://myuni.adelaide.edu.au/api/v1";


    
    function callCanvasAPI(fields, filePath, userToken, callback) {
        // get the requested params from HTML input fields
        let courseId = fields.courseId;
        let assignmentId = fields.assignmentId;
        let token = userToken;

        // read the uploaded CSV file
        fs.readFile(filePath, function (err, data) {
            var table = new Array();
            if (err) {
                // console.log(err.stack);
                return;
            }
            // convert the CSV file to an array
            convertCSV(data, function (table) {


                // get the enrollment list
                axios.get(canvasUrl + '/courses/' + courseId + '/enrollments?access_token=' + token+'&type[]=StudentEnrollment&type[]=StudentViewEnrollment')
                    .then(response => {

                        for (i in table) {
                            // get the requested params from the array
                            let studentId = table[i][0];
                            for (j in response.data) {
                                if (studentId == response.data[j].user.login_id) {
                                    table[i][9] = response.data[j].user_id;
                                }
                            }
                        }

                        // GET assignment submissions
                        axios.get(canvasUrl + '/courses/' + courseId + '/assignments/' + assignmentId + '/submissions/?include[]=submission_comments&access_token=' + token)
                            .then(response => {

                                let push_info = {};
                                let count = 0;

                                for (k in table) {
                                    for (l in response.data) {
                                        if (table[k][9] == response.data[l].user_id) {

                                            let sub = response.data[l].submission_comments.length;
                                            if (table[k][1] != response.data[l].grade) {
                                                push_info['grade_data[' + response.data[l].user_id + '][posted_grade]'] = table[k][1];
                                                count++;
                                            }
                                            if (sub > 0) {
                                                let api_comment = (response.data[l].submission_comments[sub - 1])['comment'];
                                                if (table[k][8] != api_comment) {
                                                    push_info['grade_data[' + response.data[l].user_id + '][text_comment]'] = table[k][8];
                                                    count++;
                                                }
                                            }
                                        }
                                    }
                                }

                                let headers = {
                                    "Authorization": "Bearer "+ token
                                };
                                // console.log('push_info.length:'+push_info.length);
                                if (count>0) {
                                    // post request to grade or/and comment on multiple submissions
                                    axios.post(canvasUrl + '/courses/' + courseId + '/assignments/' + assignmentId + '/submissions/update_grades',
                                        qs.stringify(push_info), {headers}
                                    ).then(response => {
                                        console.log(response.data);
                                        callback('ok');
                                    }).catch((e) => {
                                        console.log(e);
                                        callback('Cannot access to Canvas MyUni');
                                    })
                                } else {
                                    callback('No changes.');
                                }

                            }).catch((e) => {
                            console.log(e);
                                callback('Cannot access to Canvas MyUni');
                            })

                    })
                    .catch(error => {
                        console.log(error);
                        callback('Cannot access to Canvas MyUni');
                    });
                                // console.log(table);
            })
        });
        // console.log("Ok");
    }

function convertCSV(data, callBack) {
    data = data.toString();
    var table = new Array();
    var rows = new Array();
    // rows = data.split("\r\n");
    rows = data.trim().split("\n");
    for (var i = 0; i < rows.length; i++) {
        if (i > 0) {
            table.push(rows[i].split(","));
        }
    }
    callBack(table);
}


function callCanvasAPI_V1(err, fields, filePath) {
    // get the requested params from HTML input fields
    let courseId = fields.courseId;
    let assignmentId = fields.assignmentId;
    let token = fields.token;

    // read the uploaded CSV file
    fs.readFile(filePath, function (err, data) {
        var table = new Array();
        if (err) {
            // console.log(err.stack);
            return;
        }
        // convert the CSV file to an array
        convertCSV(data, function (table) {
            var student_info = new Array();

            // get the enrollment list
                            axios.get(canvasUrl + '/courses/' + courseId + '/enrollments?access_token=' + token+'&type[]=StudentEnrollment&type[]=StudentViewEnrollment')
                                .then(response => {

            for (i in table) {
                // get the requested params from the array
                let studentId = table[i][0];
                let mark = table[i][1];
                let comments = table[i][8];  // need to confirm
                let user_id;
                console.log(studentId+mark+comments);
            for (j in response.data) {
                if (studentId == response.data[j].user.login_id) {

                    user_id = response.data[j].user.id;
                    let requestedParams = {
                        "comment[text_comment]": comments,
                        "submission[posted_grade]": mark
                    }
                    let headers = {
                        "Authorization": "Bearer "+ token
                    };

                    //put request to grade and comment on a submission
                    axios.put(canvasUrl + '/courses/' + courseId + '/assignments/' + assignmentId + '/submissions/' + user_id,
                        qs.stringify(requestedParams), {headers}
                    ).then(response => {
                        console.log(response.data);
                    }).catch((e) => {
                        console.log(e)
                    })
                }
            }
            // (To be implemented: Grade or comment on MULTIPLE submissions)
            }
            })
            .catch(error => {
                // console.log(error);
            });
            console.log(table);
        })
    });
    console.log("Ok");
}

module.exports = {
    callCanvasAPI
}