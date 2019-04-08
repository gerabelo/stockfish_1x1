var cors = require("cors");
var express = require("express");
// var md5 = require('md5');
var app = express();
var port = 3000;
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
// const multer = require('multer');
// const path = require('path');
var urlencodedParser = bodyParser.urlencoded({extended: false});
// var f = require('util').format;
// var user = encodeURIComponent('cidade');
// var password = encodeURIComponent('123dbcid');

// app.use(express.static('./files'));
// var authMechanism = 'admin';

// Connection URL
// var database = f('mongodb://%s:%s@localhost:27017/cidadecoletiva?authSource=%s',user, password, authMechanism);


//var database = "mongodb://cidadecoletiva:#c1d4d3c0l3t1v4@127.0.0.1:27017/test?authenticationDatabase=admin";


var database = "mongodb://localhost/bestmoves";
mongoose.Promise = global.Promise;
mongoose.connect(database, {useNewUrlParser: true});

var BestmovesSchema = new mongoose.Schema
({
        fen: {
                type: String,
                required: true,
                unique: true,
        },
        bestmove: {
                type: String,
                required: true,
                unique: false,
        }
},{versionKey: false});

var PGNSchema = new mongoose.Schema
({
        pgn: {
                type: String,
                required: true,
                unique: true,
        },
        description: {
                type: String,
                required: false,
                unique: false,
        }
},{versionKey: false});


var Bestmove = mongoose.model("Bestmoves", BestmovesSchema);
var PGN = mongoose.model("PGNs", PGNSchema);

app.use(cors());
app.use(bodyParser.json());
app.listen(port, () => {
        console.log("Bestmoves is listening on port " + port);
});


// app.get("/", (req, res) => {
//         res.setHeader('Access-Control-Allow-Origin','*');
//         res.send("Welcome to CiCo! developed by CajuIdeas.");
// });


/* BESTMOVES */
app.post("/bestmoves/add", urlencodedParser, (req, res) => {
        var newBestmove = new Bestmove(req.body);
        res.setHeader('Access-Control-Allow-Origin','*');
        // console.log("[headers]: \n"+JSON.stringify(req.headers)+"\n\n");

        newBestmove.save()
                .then(() => {
                        console.log(JSON.stringify(req.body));
                        res.send(newBestmove);
                })
                .catch(err => {
                        console.log(JSON.stringify(err));
                        res.status(400).send(err);
                });
});

app.get("/bestmoves/list", (req, res) => {
        //res.setHeader('Access-Control-Allow-Origin','*');
        console.log(JSON.stringify(req.body));
});

/* PGN */
app.post("/pgn/add", urlencodedParser, (req, res) => {
        var newPGN = new PGN(req.body);
        res.setHeader('Access-Control-Allow-Origin','*');
        console.log(JSON.stringify(req.body));
        newPGN.save()
                .then(() => {
                        res.send(newPGN);
                })
                .catch(err => {
                        res.status(400).send(err);
                });
});
