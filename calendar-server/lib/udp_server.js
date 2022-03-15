"use strict";
/*
 * Respond to commands over a websocket to relay UDP commands to a local program
 */

var socketio = require('socket.io');
var fs = require('fs')
var io;

var dgram = require('dgram');

exports.listen = function(server) {
	io = socketio.listen(server);
	io.set('log level 1')

	io.sockets.on('connection', function(socket) {
		handleCommand(socket);
		handleUptime(socket)
	});
};

function handleCommand(socket) {
	// Pased string of comamnd to relay
	// recieve request from client
	socket.on('beatbox', function(data) {


		// var errorTimer = setTimeout(function() {
		// 	socket.emit('commandReply', "error bbb");
		// }, 1000);


		// data is a structure with:
		//  .command      - Command options: 0 (mode), 1 (volume), 2 (tempo), 3 (drum_sound)
		//	.param (int)  - Mode type options: 0, 1, 3 
		//                  volume options: up, down
		//                  tempo options: up, down
		console.log('mode command from client: ' + data);

		// Info for connecting to the local process via UDP
		var PORT = 12345;
		var HOST = '127.0.0.1';
		var buffer = new Buffer(data);

		var errorTimer;

		// relay command to udp
		var client = dgram.createSocket('udp4');
		client.send(buffer, 0, buffer.length, PORT, HOST, function(err, bytes) {
			if (err) {
				client.close();
				throw err;
			} else {
				console.log('UDP message sent to ' + HOST +':'+ PORT);
			}
			console.log('err' + err);
			
		});

		client.on('listening', function () {
			var address = client.address();
			errorTimer = setTimeout(function() {
				socket.emit('error', "error bbb");
			}, 1000);

		});
		// Handle an incoming message over the UDP from the local application.
		client.on('message', function (message, remote) {
			// console.log("UDP Client: message Rx" + remote.address + ':' + remote.port +' - ' + message);

			var reply = message.toString('utf8')
			// send response to client
			socket.emit('commandReply', reply);

			// Stop the response timeout timer:
			clearTimeout(errorTimer);
			client.close();

		});
		client.on("UDP Client: close", function() {
			console.log("closed");
		});
		client.on("UDP Client: error", function(err) {
			console.log("error: ",err);
		});
	});
};

function handleUptime(socket) {
	socket.on('proc', function(fileName) {
		// DR. BRIAN'S NOTE: Very unsafe
		var absPath = "/proc/" + fileName
		// console.log('accessing ' + absPath);
		
		fs.exists(absPath, function(exists) {
			if (exists) {
				// Can use 2nd param: 'utf8', 
				fs.readFile(absPath, function(err, fileData) {
					if (err) {
						emitSocketData(socket, fileName, 
								"ERROR: Unable to read file " + absPath);
					} else {
						emitSocketData(socket, fileName, 
								fileData.toString('utf8'));
					}
				});
			} else {
				emitSocketData(socket, fileName, 
						"ERROR: File " + absPath + " not found.");
			}
		});
	});
};

// For Status (uptime)
function emitSocketData(socket, fileName, contents) {
	var result = {
			fileName: fileName,
			contents: contents
	}
	socket.emit('fileContents', result);	
}