// var connect = require('connect');
// connect.createServer(connect.static(__dirname)).listen(8080);
var connect = require('connect'),
    serveStatic = require('serve-static');

var app = connect();
var port = 8080;

app.use(serveStatic(__dirname));
app.listen(port, () => {
    console.log("Server is listening on port " + port);
});
