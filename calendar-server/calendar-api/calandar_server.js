"use strict";
/*
 * Respond to commands over a websocket to relay UDP commands to a local program
 */

var socketio = require('socket.io');
// var fs = require('fs')
var io;

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

var requestedCalName = "";
var eventsArr = []
var io;

var dgram = require('dgram');

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

const calendarNames =  [ 'primary', 'School', 'Work' ];
// const calendarIDs = [ 'primary', 'kbc988c62g18obt43iu7amuqs4@group.calendar.google.com']
	// {}
	// 'primary': 'primary',
	// 'School': 'kbc988c62g18obt43iu7amuqs4@group.calendar.google.com'
const calendarInfo = {
		calendarNames: ['primary','School', 'Work'],
		calendarIDs: ['primary', 'kbc988c62g18obt43iu7amuqs4@group.calendar.google.com', '79tfqktj43navjfosj04qcgc7o@group.calendar.google.com'],
		calendarColours: ['blue', 'green', 'orange']
	};


// to-do: move these files somewhere safe
const TOKEN_PATH = 'calendar-api/token.json';

exports.listen = function(server) {
	io = socketio.listen(server);
	io.set('log level 1')

	io.sockets.on('connection', function(socket) {
		handleApiRequest(socket)
		handleWeatherApiRequest(socket)
		handleCommand(socket)
	});
};

function handleWeatherApiRequest(socket) {
	socket.on('weather', function(cityName) {

        // testing purposes
        cityName = 'surrey';

		var request = require('request');
        request(`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=b826132a8d9399e92d8f146145a34953&units=metric`,
            function (error, response, body) {
                let data = JSON.parse(body);
                if(response.statusCode === 200){
                    // res.send(`The weather in "${city}" is "${data.weather[0].description}`);
                    emitSocketDataWeather(socket, "weather-response", data);
                }
            }
        );
	});
};


function handleApiRequest(socket) {
	socket.on('calendar-events', function(calName) {
		// DR. BRIAN'S NOTE: Very unsafe
		// var absPath = "/proc/" + fileName
		// console.log('accessing ' + absPath);
		
		console.log("client requested calendar: ", calName)

		requestedCalName =  calName 
		var relPath = "calendar-api/credentials.json"

		fs.exists(relPath, function(exists) {
			if (exists) {
				// Can use 2nd param: 'utf8', 
				fs.readFile(relPath, function(err, content) {
					if (err) {
						emitSocketData(socket, 'calendar-events', "credentials.json", 
								"ERROR: Unable to read file " + relPath);
						return console.log('Error loading client secret file:', err);
					} else {
						authorize(JSON.parse(content), socket, calName, listEvents);

						// // to-do:
						// emitSocketData(socket, "credentials.json", 
						// 		fileData.toString('utf8'));
					}
				});
			} else {
				emitSocketData(socket, 'calendar-events', "credentials.json", 
						"ERROR: File " + relPath + " not found.");
			}
		});
	});
	socket.on('calendar-list', function () {
		// var calNames = calendarIDs.map(({ calName }) => calName)
		// var calendarColours = calendarIDs.map(({ calendarColours }) => calendarColours)
		// console.log(calNames)

		var result = { calendarNames: calendarInfo.calendarNames, calendarColours: calendarInfo.calendarColours }
		emitSocketData(socket, 'calendar-list', "list of calendars", result);
	})
};

function emitSocketDataWeather(socket, apiMessage, contents) {
	var result = {
			api: apiMessage,
			contents: contents
	}

	socket.emit('weather-api', result);	
}



function emitSocketData(socket, socketEvent, apiMessage, contents) {
	var result = {
			api: apiMessage,
			contents: contents
	}

	socket.emit(socketEvent, result);	
}


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, socket, calName, callback) {
	//   var client_id = "4026650730-aieul5jhkjuvupk0lpm8rkkcagrh8q6r.apps.googleusercontent.com"
	//   var client_secret = "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"
	const {client_secret, client_id, redirect_uris} = credentials.installed;
		// const redirect_uris = "https://developers.google.com/oauthplayground"
	const oAuth2Client = new google.auth.OAuth2(
		client_id, client_secret, redirect_uris[0]);

	// Check if we have previously stored a token.
	fs.readFile(TOKEN_PATH, (err, token) => {
		if (err) return getAccessToken(oAuth2Client, callback);
		oAuth2Client.setCredentials(JSON.parse(token));
		// var events = callback(oAuth2Client, socket);
		// return events
		var events = callback(oAuth2Client, socket, calName);
	});
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client,    callback) {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
	});
	console.log('Authorize this app by visiting this url:', authUrl);
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	rl.question('Enter the code from that page here: ', (code) => {
		rl.close();
		oAuth2Client.getToken(code, (err, token) => {
		if (err) return console.error('Error retrieving access token', err);
		oAuth2Client.setCredentials(token);
		// Store the token to disk for later program executions
		fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
			if (err) return console.error(err);
			console.log('Token stored to', TOKEN_PATH);
		});
		callback(oAuth2Client);
		});
	});
}



/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth, socket, calInfo) {
	const calendar = google.calendar({version: 'v3', auth});
	var cal_i = calendarNames.indexOf(calInfo.calendarName)
	var calID = calendarInfo.calendarIDs[cal_i];
	var calColours = calendarInfo.calendarColours[cal_i];
	console.log("CALENDAR ID: ", calID);

	// var startHour = calInfo.startHour;
	// var endHour = calInfo.endHour;
	// var startDate = new Date();
	// var endDate = new Date();
	// console.log(startDate, " ",endDate)
	// startDate.setHours(startHour)
	// endDate.setHours(endHour[0], endHour[1])
	calendar.events.list({
		// calendarId: 'primary',
		calendarId: calID,
		// timeMin: (new Date()).toISOString(),
		timeMin: calInfo.startDate,
		timeMax: calInfo.endDate,
		maxResults: 10,
		singleEvents: true,
		orderBy: 'startTime',
	}, (err, res) => {
		if (err) return console.log('The API returned an error: ' + err);
		const events = res.data.items;
		if (events.length) {
		// console.log(' Events from: ', calInfo.startDate.getHours(),  'o\'clock');
		events.map((event, i) => {
			const start = event.start.dateTime || event.start.date;
			const end = event.end.dateTime || event.end.date
			eventsArr.push(`${start} - ${end} - ${event.summary}`)
			console.log(eventsArr[i])
		});



		console.log(res.data);
		// console.log(calendar.calendarList.list())


		// To-Do: use call-back to return events; 
		
		emitSocketData(socket, 'calendar-events', "events from requested calendar", {calendarName: calInfo.calendarName, events: events, calendarColours: calColours});

		// return events
		// emitSocketData(socket, message, events);


		} else {
		
		console.log('No upcoming events found.');
		console.log(res.data);
		emitSocketData(socket, 'calendar-events', "no events from requested calendar", {calendarName: calInfo.calendarName, events: events, calendarColours: calColours});
		}
	});
}

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
				console.log("message not sent");
				client.close();
				throw err;
				
			} else {
				//console.log('UDP message sent to ' + HOST +':'+ PORT);
			}
			//console.log('err' + err);
			
		});

		client.on('listening', function () {
			var address = client.address();
			errorTimer = setTimeout(function() {
				socket.emit('error', "error bbb1");
			}, 2000);

		});
		// Handle an incoming message over the UDP from the local application.
		client.on('message', function (message, remote) {
			// console.log v("UDP Client: message Rx" + remote.address + ':' + remote.port +' - ' + message);

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
