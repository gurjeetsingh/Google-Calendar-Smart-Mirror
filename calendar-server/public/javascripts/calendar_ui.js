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



var eventsArr = []



// Make connection to server when web page is fully loaded.
var socket = io.connect();
$(document).ready(function() {


	google.charts.load('current', {'packages':['corechart']});
	google.charts.setOnLoadCallback(drawPieChart);

	getLocalDate();

	window.setInterval(function() {getLocalDate()}, 2000);

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
	socket.on('calendar-events', function(result) {
		var events = result.contents

		console.log(events)
	
		events.map((event, i) => {

			// to-do get obj list by class

			// var domObj = $('#schedule-event-title-' + i+1);

			var domObj = $('#eventdump');

			
			console.log("event " + i)


			const start = event.start.dateTime || event.start.date;
			const end = event.end.dateTime || event.end.date
			eventsArr.push(`${start} - ${end} - ${event.summary}`)
			console.log(eventsArr[i])

			var eventTitleHTML =  String(`<p>${event.summary}</p>`);

			console.log(eventTitleHTML);

			domObj.append(eventTitleHTML);

		  });
		
	});


	setTimeout(function() { sendCalendarApiRequest() }, 1000);
	// window.setInterval(function() {sendCalendarApiRequest()}, 1000);

	// sendCalendarApiRequest();

});

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


function getLocalDate() {
    var localDate = new Date();
    var weekday = weekDays[localDate.getDay()];
    var month = monthNames[localDate.getMonth()];
    var day = localDate.getDate();
    var hour = localDate.getHours(); //returns value 0-23 for the current hour
    var min = localDate.getMinutes(); //returns value 0-59 for the current minute of the hour


	if (hour < 12) {
		$('#time-period').text("AM");
		if (hour == 0) {
			hour = 12;
		}	
	} else {
		$('#time-period').text("PM");
		if (hour > 12) {
			hour -= 12;
		}
	}

	if (min < 10) { 
		min = '0' + String(min);
	}
    var text = String(hour + ':' + min);
    $('#time-numeric').text(hour + ':' + min);
    console.log(hour + ':' + min);

	$('#date-weekday').text(weekday);
	$('#date-month-day').text(month + " " + day);

}

function drawPieChart() {
	var data = google.visualization.arrayToDataTable([
		['Task', 'Hours per Day'],
		['Work',     11],
		['Eat',      2],
		['Commute',  2],
		['Watch TV', 2],
		['Sleep',    7]
	  ]);

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

// sends request for device uptime
function sendCalendarApiRequest() {

	// socket.connected for v0.9	
	if (socket.socket.connected) {
		socket.emit('calendar');
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

