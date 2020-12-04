const axios = require('axios');
const fs = require("fs");
const qs = require("qs");

let Client = require('ssh2-sftp-client');

// let host  = '192.168.18.47';
let host  = '172.20.10.10';
let port = '22';
let username = 'teacher';
let password = 'teacher';


const websubUrl = '/users/assessment/websubmit/';

function callWebSubYear(callback) {

    let sftp = new Client();

    sftp.connect({
        host: host,
        port: port,
        username: username,
        password: password
    }).then(() => {
        return sftp.list(websubUrl);
    }).then(data => {

        sftp.end();
        callback(data);
    }).catch(err => {

        let errMsg = [
            {
                name: 'No SFTP connection available'
            }
        ];
        callback(errMsg);
        console.log(err, 'catch error');
        sftp.end();
    });
}

function callWebSubSemester(callback, path) {

    let sftp = new Client();

    sftp.connect({
        host: host,
        port: port,
        username: username,
        password: password
    }).then(() => {

        return sftp.list(websubUrl+path);
    }).then(data => {



        sftp.end();
        callback(data);
    }).catch(err => {
        console.log('c');
        console.log(err, 'catch error');
        sftp.end();
    });
}

function callWebSubCourse(callback, path) {

    let sftp = new Client();

    sftp.connect({
        host: host,
        port: port,
        username: username,
        password: password
    }).then(() => {
        return sftp.list(websubUrl+path);
    }).then(data => {
        sftp.end();
        callback(data);
    }).catch(err => {
        console.log('c');
        console.log(err, 'catch error');
        sftp.end();
    });
}

function callWebSubAssignment(callback, path) {

    let sftp = new Client();

    sftp.connect({
        host: host,
        port: port,
        username: username,
        password: password
    }).then(() => {
        return sftp.list(websubUrl+path);
    }).then(data => {
        sftp.end();
        callback(data);
    }).catch(err => {
        console.log('c');
        console.log(err, 'catch error');
        sftp.end();
    });
}

function getFile(callback, path) {

    let sftp = new Client();

    sftp.connect({
        host: host,
        port: port,
        username: username,
        password: password
    }).then(() => {
        var filePath = __dirname + "/uploads/t.csv";
        file_path = filePath;

        return sftp.get(websubUrl + path + '/marks-all.csv',filePath);
    }).then(data => {
        sftp.end();
        callback(file_path);
    }).catch(err => {
        console.log('c');
        console.log(err, 'catch error');
        sftp.end();
    });
}

module.exports = {
    callWebSubYear,callWebSubSemester,callWebSubCourse, callWebSubAssignment, getFile
}