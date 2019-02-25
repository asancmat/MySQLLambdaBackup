let AWS = require('aws-sdk');
let moment = require("moment");
let mysqldump = require('mysqldump')

exports.handler = (event) => {
    return new Promise((resolve, reject) => {
        console.log('Start backup');
        console.log("Database dump");
        mysqldump({
            connection: {
                host: bbdd_host,
                port: bbdd_port,
                user: username,
                password: password,
                database: databaseName
            }
        }).then(dumpResult => {
            uploadToS3(createKey("schema"), dumpResult.dump.schema, function (err, result) {
                if (!err) {
                    uploadToS3(createKey("data"), dumpResult.dump.data, function (err2, result2) {
                        if (!err2) {
                            console.log('End backup');
                            resolve("finished");
                        } else {
                            console.log("any error! " + result2);
                            resolve("error");
                        }
                    });
                } else {
                    console.log("any error! " + result);
                    resolve("error");
                }
            });

        })
    });
};

var username = process.env.ddbb_username;
var password = process.env.ddbb_password;
var databaseName = process.env.ddbb_databaseName;
var amazon_access_key = process.env.amazon_access_key;
var amazon_secret = process.env.amazon_secret;
var bbdd_port = process.env.ddbb_port;
var bbdd_host = process.env.ddbb_host;

var createKey = ((type) => {
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth() + 1;
    var key = year + "/" + month + "/" + databaseName + '-' + moment().format('YYYY-MM-DD-HH-mm-ss') + "-" + type + '.sql';
    return key;
});

var uploadToS3 = ((key, buffer, calback) => {
    AWS.config = new AWS.Config();
    AWS.config.update({
        accessKeyId: amazon_access_key,
        secretAccessKey: amazon_secret
    });

    var s3 = new AWS.S3();
    s3.putObject({
        Bucket: "directus-backup-des",
        Key: key,
        Body: buffer
    }, function (err, resp) {
        if (err) {
            console.log("Error in uploading image to s3", err);
            calback(true, err);
        } else {
            console.log("Dump process done");
            calback(false, null);
        }
    });
});