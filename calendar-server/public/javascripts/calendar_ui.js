"use strict";
// Client-side interactions with the browser.

const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
 ];
 
 const weekDays = [
    "Sunday",
    "Monday ",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
 ];


const eventStyles = {
	// title, time, background
	// red
	"red": {
		"title": "rgb(255, 255, 255)", "time" : "rgb(255, 186, 164)", "background": "rgb(255, 61, 0);"
	},
	// green
	"green": {"title": "rgb(255, 255, 255)", "time" : "rgb(247 255 239);", "background" : "rgb(55, 209, 47);"
	},
	// orange
	"orange": {"title": "rgb(255, 255, 255)", "time" : "rgb(255, 244, 200)", "background" : "rgba(255,160,34,1);"
	},
	// blue
	"blue": {"title": "rgb(255, 255, 255)", "time" : "rgb(188, 243, 255)", "background" : "rgb(14, 165, 255);"
	}
}

// const eventStyles = [
// 	//  background, time, title,
// 	// red
// 	["rgba(176,0,0,0.1)", "rgba(146,0,0,0.8)", "rgba(146,0,0,1)"],
// 	// green
// 	["rgba(0,176,0,0.15)", "rgba(0,146,0,0.8)", "rgba(0,146,0,1)"],
// 	// orange
// 	["rgba(244,196,29,0.2)", "rgba(166,112,0,0.8)", "rgb(198,135,5)"],
// 	// blue
// 	["rgba(9, 167, 207,0.1)", "rgba(0,147,187,0.8)", "rgba(0,147,187,1)"]
// ];

// const eventStyles = {
// 	colourNames: ["red", "green", "orange", "blue"],
// 	backgroundColors: ["rgba(176,0,0,0.1)", "rgba(0,176,0,0.15)", "rgba(244,196,29,0.2)", "rgba(9, 167, 207,0.1)"],
// 	time: ["rgba(146,0,0,0.8)", "rgba(0,146,0,0.8)", "rgba(166,112,0,0.8)", "rgba(0,147,187,0.8)"],
// 	title: ["rgba(146,0,0,1)", "rgba(0,146,0,1)", "rgb(198,135,5)", "rgba(0,147,187,1)"],

// }




var eventsArr = []
var selectedEvent = 0;
// var eventsTitle = []

var calendarNames = [];
var calendarColours = [];

// on keypress
$(document).keypress(function(e) {
	console.log(e)
	e.preventDefault();
	console.log("keypress")
	var code = e.keyCode || e.which;
	if(code == 119) { // w
		console.log("w key pressed");
		updateSelectedEvent("up");
	} 
	if(code == 115) { // s
		console.log("s key pressed");
		updateSelectedEvent("down");
	}
});

// Make connection to server when web page is fully loaded.
var socket = io.connect();
$(document).ready(function() {


	google.charts.load('current', {'packages':['corechart']});
	// google.charts.setOnLoadCallback(drawPieChart);

	getLocalDate();
	
	

	window.setInterval(function() {getLocalDate(); }, 2000);

	// bbb udp command from as3
	window.setInterval(function() {sendCommand("status 0")}, 800);

	socket.on('commandReply', function(result) {

		// hide error message if we recieve a response
		hideError();
		var command = result.split(' ')
		switch(command[0]) {
			case "tempo":
				$('#BPMid').val(command[1])
				break;
			default:
				break;
		}
	});

	// message from server that bbb is unresponsive
	socket.on('error', function(result) {
		displayError("'BeagleBone is unavailable.'");
	});

	// Handle data coming back from the server
	socket.on('calendar-list', function(result) {
		calendarNames = result.contents.calendarNames
		calendarColours = result.contents.calendarColours
		console.log("Names of calendars")
		console.log(calendarNames)

	});	

	// Handle data coming back from the server
	socket.on('calendar-events', function(result) {
		var events = result.contents.events
		var colourName = result.contents.calendarColours

		console.log(events)
	
		// var cntObj = $('#schedule-event-cnt')
		events.map((event, i) => {

			// // to-do get obj list by class
			// var timeObj = $('#schedule-event-time-' + i).addClass("schedule-event-time")
			// var domObj = $('#schedule-event-title-' + i).addClass("schedule-event-title")

			// $("schedule-event-cnt").append("Some appended text.");

			const start = new Date(event.start.dateTime)
			var startHour = start.getHours(); //returns value 0-23 for the current hour
			var startMin = start.getMinutes(); //returns value 0-59 for the current minute of the hour
			const convertedStartTime = convertToStringTime(startHour, startMin);
			const end = new Date(event.end.dateTime)
			var endHour = end.getHours(); //returns value 0-23 for the current hour
			var endMin = end.getMinutes(); //returns value 0-59 for the current minute of the hour
			const convertedEndTime = convertToStringTime(endHour, endMin);


			// eventsArr.push(`${convertedStartTime} - ${convertedEndTime}`)
			
			// eventsTitle.push(`${event.summary}`)
			// console.log(`${eventsArr[i]}\n`)
			// console.log(`${eventsTitle[i]}\n`)

			// for(let i = 1; i < eventsArr.length; i++ ) {
			// 	timeObj.html(eventsArr[i])
			// 	domObj.html(eventsTitle[i])
			// }			
			
			var eventTime = `${convertedStartTime} - ${convertedEndTime}`
			var eventTitle = event.summary

			// convert 1hr == 60 min time to 1hr == 100 
			var startTime24 = parseInt(startHour) + (startMin/60);
			var endTime24 = parseInt(endHour) + (endMin/60);
			console.log("startTime24: ", startTime24, " endTime24: ", endTime24)
			var piechartTime = {start: startTime24,
								length: Math.abs(endTime24 - startTime24) 
								}
			

			var eventColours = eventStyles[colourName];

			eventsArr.push({ mstime: event.start.dateTime, eventTime: eventTime, piechartTime: piechartTime, eventTitle: eventTitle, desc: event.description, style: eventColours});
			


			// var eventDivHTMTL = 
			// 	`<div class=schedule-event id=event${i} style="background-color: ${eventColours.background}" >
			// 		<div class="schedule-event-time" id="schedule-event-time-${i}" style="color: ${eventColours.time}">${eventTime}</div>
			// 		<div class="schedule-event-title" id="schedule-event-title-${i}" style="color: ${eventColours.title}">${eventTitle}</div>
			// 		<div class="schedule-event-desc" id="schedule-event-desc-${i}" style="display: none; color: ${eventTitle}">${event.description}</div>
			// 	</div>`
			// cntObj.append(eventDivHTMTL)

			// var eventObj = $('#event' + i)

			// eventObj.append('<div class=schedule-event-title id=schedule-event-title-"' + i +'">' + eventsTitle[i] + '</div>')
			// var back = ["#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#f1c40f", "#e67e22", "#e67e22"];
			// for(let i = 5; i < events.length+5; i++) {
			// 	var rand = back[Math.floor(Math.random() * back.length)];
			// 	eventObj.css('background',rand)
			// }
			// i++
			
		  });
	});	


	// Handle data coming back from the server
	socket.on('weather-api', function(result) {
		var events = result.contents

		var icon = result.contents.weather[0].icon
		var weatherIconURL = `http://openweathermap.org/img/wn/${icon}@2x.png`


		$('#weather-icon').attr("src", weatherIconURL);
		console.log(events)

		var city = result.contents.name;
		var celsius = Math.round( parseFloat(result.contents.main.temp));

		$('#weather-city').html(city);

		$('#weather-celsius-mag').html(celsius);

	});		  
		

	// to-do: use promises...getCalendarNames();
	setTimeout(function() { getCalendarInfo(); }, 500);
	setTimeout(function() { sendCalendarApiRequest(); sendWeatherApiRequest() }, 1000);
	setTimeout(function() { populateEvents(); google.charts.setOnLoadCallback(drawPieChart); }, 3000);


	
	// window.setInterval(function() {sendCalendarApiRequest()}, 1000);

	// sendCalendarApiRequest();

});

// update events cnt if window size changed
$(window).resize(function () {
    console.log($('#schedule-cnt').height()); 
});







function apiRequestCalendarEvents() {
	// send socket request to server

	// testing w/o server connection
	var result = {
		events : [
			{time: "time 1", title: "title 1"}, 
			{time: "time 2", title: "title 2"},
			{time: "time 3", title: "title 3"},
		]
	};

	return result;

	// end testing
}




// sends request for device uptime
function sendWeatherApiRequest() {

	// socket.connected for v0.9	
	if (socket.socket.connected) {
		socket.emit('weather');
	} else {
		console.log("no server connection");
	}
}


function getLocalDate() {
    var localDate = new Date();
    var weekday = weekDays[localDate.getDay()];
    var month = monthNames[localDate.getMonth()];
    var day = localDate.getDate();
    var hour = localDate.getHours(); //returns value 0-23 for the current hour
    var min = localDate.getMinutes(); //returns value 0-59 for the current minute of the hour


	// if (hour < 12) {
	// 	$('#time-period').text("AM");
	// 	if (hour == 0) {
	// 		hour = 12;
	// 	}	
	// } else {
	// 	$('#time-period').text("PM");
	// 	if (hour > 12) {
	// 		hour -= 12;
	// 	}
	// }

	// if (min < 10) { 
	// 	min = '0' + String(min);
	// }

	
    var text = convertToStringTime(hour, min);
    $('#time-numeric').text(text);

	$('#date-weekday').text(weekday);
	$('#date-month-day').text(month + " " + day);

}

function convertToStringTime(hour, minutes) {
	if (hour < 10) {
		hour = '0' + String(hour);
	}
	if (minutes < 10) { 
		minutes = '0' + String(minutes);
	}
    // var text = String(hour + ':' + minutes);
    // console.log(hour + ':' + minutes);
	return hour + ':' + minutes
}

function propertySort(prop) {
	return function(a, b) {
		return (a[prop] < b[prop]) ? -1 : (a[prop] > b[prop]) ? 1 : 0;
	}
}
function populateEvents() {
	eventsArr.sort(propertySort('mstime'))
	eventsArr.map((event, i) => {
		var eventDivHTMTL = 
		`<div class=schedule-event id=event${i} style="background-color: ${event.style.background}" >
			<div class="schedule-event-time" id="schedule-event-time-${i}" style="color: ${event.style.time}">${event.eventTime}</div>
			<div class="schedule-event-title" id="schedule-event-title-${i}" style="color: ${event.style.title}">${event.eventTitle}</div>
			<div class="schedule-event-desc" id="schedule-event-desc-${i}" style="display: none; color: ${event.style.title}">${event.desc}</div>
		</div>`
	$('#schedule-event-cnt').append(eventDivHTMTL)
	});
}
function drawPieChart() {
	// eventsArr.sort(propertySort('mstime'))

	console.log(eventsArr)

	var pieDataArr = [['Events', 'Time']];
	for (var i = 0; i < eventsArr.length; i++) {
		console.log(eventsArr[i])
		var event = eventsArr[i]
		pieDataArr.push([event.eventTitle, event.piechartTime.length])
	}

	// var data = google.visualization.arrayToDataTable([
	// 	['Events', 'Hours'],
	// 	['Work',     11],
	// 	['Eat',      2],
	// 	['Commute',  2],
	// 	['Watch TV', 2],
	// 	['Sleep',    7]
	//   ]);

	var data = google.visualization.arrayToDataTable(pieDataArr);



	console.log("og height");
	  console.log($('#schedule-cnt').height());

	  var height = $('#schedule-cnt').height();
	  var width = $('#piechart').width();

	  $('#schedule-cnt').height(height);


	  console.log(typeof(height));
	  console.log(height + ' ' + width);

	  var options = {
		legend: 'none',
		chartArea: { 
			height: 1000,
			top: 0, 
			left: 5,
			right: 5
		},
		height: height + 100,
		pieSliceText : 'none'

	  };

	  var chart = new google.visualization.PieChart(document.getElementById('piechart'));

	  chart.draw(data, options);
}



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

function getCalendarInfo() {
	// socket.connected for v0.9	
	if (socket.socket.connected) {
		socket.emit('calendar-list');
	} else {
		console.log("no server connection");
	}	
}

// sends request for device uptime
function sendCalendarApiRequest() {

	// socket.connected for v0.9	
	if (socket.socket.connected) {
		for(var i = 0; i < calendarNames.length; i++) {
			socket.emit('calendar', calendarNames[i]);
		}

		console.log("socket emmit calendar");
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

function convertMsToTime(milliseconds) {
    var minutes = Math.floor((milliseconds / (1000 * 60)) % 60)
    var hours = Math.floor((milliseconds/ (1000 * 60 * 60)) % 24);

  	hours = (hours < 10) ? "0" + hours : hours;
  	minutes = (minutes < 10) ? "0" + minutes : minutes;

  	// return hours + ":" + minutes
	  return [hours, minutes]
}
  
function updateSelectedEvent(dir) {
	var numEvents = eventsArr.length;

	var eventDescObj = $('#schedule-event-desc-' + selectedEvent)
	// var eventColour = eventDescObj.css()
	eventDescObj.css('display', 'none')


	if (dir === 'up') {
		selectedEvent = (selectedEvent+numEvents-1) % numEvents; 
	} else if (dir === 'down') {
		selectedEvent = (selectedEvent+1) % numEvents;
	}
	// var event = eventsArr[selectedEvent]
	// console.log('selected event #' + selectedEvent);
	// var eventColours = eventStyles[selectedEvent];
	// var eventObj = $('#event' + selectedEvent)
	// var eventDescDivHTMTL = 
	// 	`<div class="schedule-event-desc" id="schedule-event-desc-${selectedEvent}" style="color: ${eventColours[1]}">${event.desc}</div>`
	// eventObj.append(eventDescDivHTMTL)

	eventDescObj = $('#schedule-event-desc-' + selectedEvent)
	eventDescObj.css('display', 'revert')
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
