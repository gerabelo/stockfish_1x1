var cors = require("cors");
var express = require("express");
var app = express();
var port = 3000;
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;
var urlencodedParser = bodyParser.urlencoded({extended: false});
var database = "mongodb://localhost/chess";
mongoose.Promise = global.Promise;
mongoose.connect(database, {useNewUrlParser: true});

var BestmovesSchema = new mongoose.Schema
({
        fen: {
                type: String,
                required: true,
                unique: true
        },
        bestmove: {
                type: String,
                required: true,
                unique: false
        },
        elo: {
                type: String,
                required: false,
                unique: false
        }
},{versionKey: false});

var PGNSchema = new mongoose.Schema
({
        pgn: {
                type: String,
                required: true,
                unique: false,
        },
        result: {
                type: String,
                required: false,
                unique: false,
        },
        white: {
                type: String,
                required: true,
                unique: false,
        },
        black: {
                type: String,
                required: true,
                unique: false,
        },
        date: {
                type: String,
                required: true,
                unique: false,
        }
},{versionKey: false});

var MateInNSchema = new mongoose.Schema
({
        fen: {
                type: String,
                required: true,
                unique: true
        },
        mateinn: {
                type: String,
                required: true,
                unique: false
        },
        elo: {
                type: String,
                required: false,
                unique: false
        }
},{versionKey: false});


var Bestmove = mongoose.model("Bestmoves", BestmovesSchema);
var PGN = mongoose.model("PGNs", PGNSchema);
var MateInN = mongoose.model("MateInNs",MateInNSchema);

app.use(cors());
app.use(bodyParser.json());
app.listen(port, () => {
        console.log("Permanencia is listening on port " + port);
});


// app.get("/", (req, res) => {
//         res.setHeader('Access-Control-Allow-Origin','*');
//         res.send("Welcome to CiCo! developed by CajuIdeas.");
// });


app.post("/mateinn/add", urlencodedParser, (req, res) => {
        var newMateInN = new MateInN(req.body);
        res.setHeader('Access-Control-Allow-Origin','*');
        // console.log("[headers]: \n"+JSON.stringify(req.headers)+"\n\n");

        newMateInN.save()
                .then(() => {
                        console.log(JSON.stringify(newMateInN));
                        res.send(newMateInN);
                })
                .catch(err => {
                        console.log(JSON.stringify(err));
                        res.status(400).send(err);
                });
});

app.get("/mateinn/list", (req, res) => {
        res.setHeader('Access-Control-Allow-Origin','*');
        MateInN.find({}, (err,data) => {
                if (err) {
                        console.log(JSON.stringify(req.body));
                        res.send(err);
                } else {
                        console.log(JSON.stringify(err));
                        res.send(data);
                }
        })
});

app.post("/bestmoves/add", urlencodedParser, (req, res) => {
        var newBestmove = new Bestmove(req.body);
        res.setHeader('Access-Control-Allow-Origin','*');
        // console.log("[headers]: \n"+JSON.stringify(req.headers)+"\n\n");

        newBestmove.save()
                .then(() => {
                        //console.log(JSON.stringify(req.body));
                        //res.send(JSON.stringify(newBestmove));
                })
                .catch(err => {
                        //console.log(JSON.stringify(err));
                        //res.status(400).send(err);
                });
});

app.get("/bestmoves/list", (req, res) => {
        res.setHeader('Access-Control-Allow-Origin','*');
        Bestmove.find({}, (err,moves) => {
                if (err) {
                        console.log(JSON.stringify(req.body));
                        res.send(err);
                } else {
                        console.log(JSON.stringify(err));
                        res.send(moves);
                }
        })
});

/* PGN */
app.post("/pgn/add", urlencodedParser, (req, res) => {
        var newPGN = new PGN(req.body);
        res.setHeader('Access-Control-Allow-Origin','*');
        newPGN.save()
                .then(() => {
                        //console.log(JSON.stringify(req.body));
                        //res.send(newPGN);
                })
                .catch(err => {
                        //console.log(JSON.stringify(err));
                        //res.status(400).send(err);
                });
});

app.get("/pgn/list", (req, res) => {
        res.setHeader('Access-Control-Allow-Origin','*');
        PGN.find({}, (err,data) => {
                if (err) {
                        console.log(JSON.stringify(req.body));
                        res.send(err);
                } else {
                        console.log(JSON.stringify(err));
                        res.send(data);
                }
        })
});
