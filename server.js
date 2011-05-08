/*!
 * RTGSE (Real Time Geolocation Sharing Experiment) using Websockets, Google Maps and NodeJS.
 *
 * Copyright (c) 2011 Sebastien P.
 *
 * http://twitter.com/_sebastienp
 * http://github.com/sebastien-p/jquery.hasEventListener
 * http://jsfiddle.net/sebastienp/eHGqB/
 *
 * MIT licensed.
*/


var express = require("express"),
	io = require("socket.io"),
	app = express.createServer(),
	count = 0,
	clients = {};

app.configure(function () {

	app.use(express.static(__dirname + "/public"));

});

app.get("/", function (req, res) {

    res.render("./public/index.html");

}).listen(3000);

io.listen(app).on("connection", function (client) {

	var id = client.sessionId;

	count && client.send(JSON.stringify(clients));
	count += 1;

	client.on("disconnect", function () {

		client.broadcast('{"type":"disconnect","id":' + id + "}");
		delete clients[id];
		count -= 1;

	}).on("message", function (message) {

		clients[id] = message;
		client.broadcast(JSON.stringify(message));

	});

});

console.log("Express server started on port %s", app.address().port);