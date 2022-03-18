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
var eventsArr = []

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];


// to-do: move these files somewhere safe
const TOKEN_PATH = 'calendar-api/token.json';

exports.listen = function(server) {
	io = socketio.listen(server);
	io.set('log level 1')

	io.sockets.on('connection', function(socket) {
		handleApiRequest(socket)
		handleWeatherApiRequest(socket)
	});
};

function handleWeatherApiRequest(socket) {
	socket.on('weather', function(cityName) {

        // testing purposes
        cityName = 'vancouver';

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
	socket.on('calendar', function(fileName) {
		// DR. BRIAN'S NOTE: Very unsafe
		// var absPath = "/proc/" + fileName
		// console.log('accessing ' + absPath);
		
		var relPath = "calendar-api/credentials.json"

		fs.exists(relPath, function(exists) {
			if (exists) {
				// Can use 2nd param: 'utf8', 
				fs.readFile(relPath, function(err, content) {
					if (err) {
						emitSocketData(socket, "credentials.json", 
								"ERROR: Unable to read file " + relPath);
						return console.log('Error loading client secret file:', err);
					} else {
						authorize(JSON.parse(content), socket, listEvents);

						// // to-do:
						// emitSocketData(socket, "credentials.json", 
						// 		fileData.toString('utf8'));
					}
				});
			} else {
				emitSocketData(socket, "credentials.json", 
						"ERROR: File " + relPath + " not found.");
			}
		});
	});
};

function emitSocketDataWeather(socket, apiMessage, contents) {
	var result = {
			api: apiMessage,
			contents: contents
	}

	socket.emit('weather-api', result);	
}



function emitSocketData(socket, apiMessage, contents) {
	var result = {
			api: apiMessage,
			contents: contents
	}

	socket.emit('calendar-events', result);	
}


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, socket, callback) {
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
		var events = callback(oAuth2Client, socket);
	});
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
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
function listEvents(auth, socket) {
	const calendar = google.calendar({version: 'v3', auth});
	calendar.events.list({
		calendarId: 'primary',
		timeMin: (new Date()).toISOString(),
		maxResults: 10,
		singleEvents: true,
		orderBy: 'startTime',
	}, (err, res) => {
		if (err) return console.log('The API returned an error: ' + err);
		const events = res.data.items;
		if (events.length) {
		console.log('Upcoming 10 events:');
		events.map((event, i) => {
			const start = event.start.dateTime || event.start.date;
			const end = event.end.dateTime || event.end.date
			eventsArr.push(`${start} - ${end} - ${event.summary}`)
			console.log(eventsArr[i])
		});


		// To-Do: use call-back to return events; 
		
		emitSocketData(socket, "calendar-events", events);

		// return events
		// emitSocketData(socket, message, events);


		} else {
		console.log('No upcoming events found.');
		}
	});
}

