"use strict";
// Client-side interactions with the browser.

// Make connection to server when web page is fully loaded.
var socket = io.connect();
$(document).ready(function() {

	// send drum pattern mode commands
	$('#mode0').click(function(){
		sendCommand("mode 0");
	});
	$('#mode1').click(function(){
		sendCommand("mode 1");
	});
	$('#mode2').click(function(){
		sendCommand("mode 2");
	});
	$('#mode3').click(function(){
		sendCommand("mode 3");
	});

	// send volume commands
	$('#volumeDown').click(function(){
		sendCommand("volume -5");
	});
	$('#volumeUp').click(function(){
		sendCommand("volume 5");
	});

	// send tempo commands
	$('#decreaseBPM').click(function(){
		sendCommand("tempo -5");
	});
	$('#increaseBPM').click(function(){
		sendCommand("tempo 5");
	});

	// send drumming commands
	$('#hihatSound').click(function(){
		sendCommand("drum 0");
	});
	$('#snareSound').click(function(){
		sendCommand("drum 1");
	});
	$('#baseSound').click(function(){
		sendCommand("drum 2");
	});

	window.setInterval(function() {sendCommand("status 0")}, 800);

	socket.on('commandReply', function(result) {

		// hide error message if we recieve a response
		hideError();
		var command = result.split(' ')
		switch(command[0]) {
			case "tempo":
				$('#BPMid').val(command[1])
				break;
			case "volume":
				$('#volumeid').val(command[1]);
				break;
			case "mode":
				//button value/name
				var modeName = $('#mode' + command[1]).val()
				$('#modeid').text(modeName)
				break;
			case "status":
				$('#volumeid').val(command[2]);
				$('#BPMid').val(command[3])
				var modeName = $('#mode' + command[1]).val()
				$('#modeid').text(modeName)
				break;
			// case "error":
			// 	displayError("'BeagleBone is unavailable.'")
			// 	break;
			default:
				break;
		}
	});

	// message from server that bbb is unresponsive
	socket.on('error', function(result) {
		displayError("'BeagleBone is unavailable.'");
	});

	window.setInterval(function() {sendRequest('uptime')}, 1000);

	// Handle data coming back from the server
	socket.on('fileContents', function(result) {
		var contents = result.contents.split(' ')
		// in seconds
		var uptime = contents[0]
		console.log("uptime is "+ uptime)
		var domObj = $('#status')

		var uptimeConverted = new Date(uptime * 1000).toISOString().substr(11, 8)
		// Make linefeeds into <br> tag.
		uptimeConverted = replaceAll(uptimeConverted, "\n", "<br/>");
		console.log(uptimeConverted)
		domObj.html(uptimeConverted);
	});
});

// sends command to server for status updates and commands for bbb
function sendCommand(message) {
	if (socket.socket.connected) {
		socket.emit('beatbox', message);
	} else {
		// Lost socket connection to nodeJS server
		console.log("no server connection");
		displayError("'Lost connection to server.'");
	}
	
}

// sends request for device uptime
function sendRequest(file) {
	console.log("Requesting '" + file + "'");

	// socket.connected for v0.9	
	if (socket.socket.connected) {
		socket.emit('proc', file);
	} else {
		console.log("no server connection");
	}
}

function replaceAll(str, find, replace) {
	return str.replace(new RegExp(find, 'g'), replace);
}

function displayError(message) {
	$('#error-box').css('display', 'revert');
	$('#container').css('padding-bottom', '0');

	var msgHTML = replaceAll(message, "\n", "<br/>");
	$('#error-text').html(msgHTML);
}

function hideError() {
	$('#error-box').css('display', 'none');
	$('#container').css('padding-bottom', '2em');

	var msgHTML = replaceAll("No errors", "\n", "<br/>");
	$('#error-text').html(msgHTML);
}
