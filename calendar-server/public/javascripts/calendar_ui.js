"use strict";

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
		"title": "rgb(255, 255, 255)", "time" : "rgb(255, 186, 164)", 
		"background-active": "rgb(255, 61, 0)"   , "background": "#FFC14D" 
	},
	// green
	"green": {"title": "rgb(255, 255, 255)", "time" : "rgb(247 255 239)", 
	"background-active" : "#37D12F" , "background":     "#9fe99b"
	},
	// orange
	"orange": {"title": "rgb(255, 255, 255)", "time" : "rgb(255, 244, 200)",
	 "background-active" : "#ffa022"  , "background": "#ffcd71"     
	},
	// blue
	"blue": {"title": "rgb(255, 255, 255)", "time" : "rgb(188, 243, 255)",
	 "background-active" : "#00A0FF", "background": "#71caff"      
	}
}

var viewMode = 0;

var chart;

var eventsArr = { 
	AM : [],
	PM: []
}
var selectedEvent = 0;
var selectedSlice = 0;
var currPotReading = 0;

var calendarNames = [];
var calendarColours = [];

var eventsRecieved = 0;

var timePeriod = "AM";

var pieDataArr;
var sliceColours;

var options;
var chartData;

var localHour;
var localMin;
var localTime12;

// handling on keypress for events list
$(document).keypress(function(e) {
	e.preventDefault();
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

	// prepare google charts api
	google.charts.load('current', {'packages':['corechart']});

	// get and set local date for ui and requests
	getLocalDate();
	window.setInterval(function() {getLocalDate(); }, 2000);


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

		sendCalendarApiRequest();
		sendWeatherApiRequest();
	});	

	// Handle data coming back from the server
	socket.on('calendar-events', function(result) {
		var events = result.contents.events
		var colourName = result.contents.calendarColours

		events.map((event, i) => {

			const start = new Date(event.start.dateTime)
			var startHour = start.getHours(); //returns value 0-23 for the current hour
			var startMin = start.getMinutes(); //returns value 0-59 for the current minute of the hour
			const convertedStartTime = convertToStringTime(startHour, startMin);
			const end = new Date(event.end.dateTime)
			var endHour = end.getHours(); //returns value 0-23 for the current hour
			var endMin = end.getMinutes(); //returns value 0-59 for the current minute of the hour
			const convertedEndTime = convertToStringTime(endHour, endMin);		
			
			var eventTime = `${convertedStartTime} - ${convertedEndTime}`
			var eventTitle = event.summary

			// convert 1hr == 60 min time to 1hr == 100 
			var startTime12 = parseInt(t24to12pieHour(startHour)) + (startMin/60);
			var endTime12 = parseInt(t24to12pieHour(endHour)) + (endMin/60);

			if (endTime12 < startTime12) {
				endTime12 = 12;
			}

			var lengthTime12 = endTime12 - startTime12;
			var pieChartTime = {start: startTime12,
								end: endTime12,
								length: lengthTime12 
								}
			console.log("event: ", eventTitle, " ", eventTime)
			console.log("startTime12: ", startTime12, " endTime12: ", endTime12)
			console.log("lengthTime12: ", lengthTime12)		

			var eventColours = eventStyles[colourName];


			var eventPeriodList = (timePeriod == "AM") ? eventsArr['AM'] : eventsArr['PM']
			eventPeriodList.push({ mstime: event.start.dateTime, eventTime: eventTime, pieChartTime: pieChartTime, 
				eventTitle: eventTitle, desc: event.description, 
				style: eventColours, colourName: colourName});
			
		  });

		  eventsRecieved++;

		//   console.log("eventsRecieved: ", eventsRecieved)
		//   console.log("CalName: ", result.contents.calendarName)
		if (eventsRecieved == calendarNames.length) {
			populateEvents();
			console.log(events)
			google.charts.setOnLoadCallback(drawPieChart);
		}


		
	});	


	// Handle data coming back from the server
	socket.on('weather-api', function(result) {
		var events = result.contents

		var icon = result.contents.weather[0].icon
		var weatherIconURL = `http://openweathermap.org/img/wn/${icon}@2x.png`

		$('#weather-icon').attr("src", weatherIconURL);

		var city = result.contents.name;
		var celsius = Math.round( parseFloat(result.contents.main.temp));

		$('#weather-city').html(city);
		$('#weather-celsius-mag').html(celsius);

	});		  
		

	// wait until page is ready, send requests to server
	setTimeout(function() { getCalendarInfo(); }, 500);	
	window.setInterval(function() {sendCommand("pot 0")}, 8000);

	window.setInterval(function() {sendCommand("viewButton 0")}, 1000);

	socket.on('commandReply', function(result) {

		// hide error message if we recieve a response
		hideError();
		var command = result.split(' ')
		switch(command[0]) {
			case "tempo":
				$('#BPMid').val	(command[1])
				break;
			case "screen":
				console.log("Screen Button Reply");
				handleScreenButtonPressed(command[1]);
				break;
			case "pot":
				handlePotChange(parseInt(command[1]));
				console.log("Sector = ", parseInt(command[1]));
				break;
			default:
				break;
		}
	});


});


// sends request for device uptime
function sendWeatherApiRequest() {

	// socket.connected for v0.9	
	if (socket.socket.connected) {
		socket.emit('weather', 'surrey');
	} else {
		console.log("no server connection");
	}
}

function t24to12pieHour(hour) {
	if (hour >= 12) {
		hour -= 12;
	}
	return hour	
}

function t24to12Hour(hour) {
	if (hour < 12) {
		if (hour == 0) {
			hour = 12;
		}	
	} else {
		if (hour > 12) {
			hour -= 12;
		}
	}	
	return hour
}

function getLocalDate() {
    var localDate = new Date();
    var weekday = weekDays[localDate.getDay()];
    var month = monthNames[localDate.getMonth()];
    var day = localDate.getDate();
    localHour = localDate.getHours(); //returns value 0-23 for the current localHour
    localMin = localDate.getMinutes(); //returns value 0-59 for the current localMinute of the localHour

	console.log("LOCAL TIME 12", localTime12);

	if (localHour < 12) {
		$('#time-period').text("AM");
		if (localHour == 0) {
			localTime12 = parseInt(localHour) + (localMin/60);
			localHour = 12;
		}	
		timePeriod = "AM";
	} else {
		$('#time-period').text("PM");
		if (localHour > 12) {
			localHour -= 12;
			localTime12 = parseInt(localHour) + (localMin/60);
		}
		timePeriod = "PM";
	}
	
    var text = convertToStringTime(localHour, localMin);
    $('#time-numeric').text(text);

	$('#date-weekday').text(weekday);
	$('#date-month-day').text(month + " " + day);

}

function convertToStringTime(hour, minutes) {
	hour = t24to12Hour(hour)

	if (hour < 10) {
		hour = '0' + String(hour);
	}
	if (minutes < 10) { 
		minutes = '0' + String(minutes);
	}
	return hour + ':' + minutes
}

function propertySort(prop) {
	return function(a, b) {
		return (a[prop] < b[prop]) ? -1 : (a[prop] > b[prop]) ? 1 : 0;
	}
}
function populateEvents() {
	var eventPeriodList = (timePeriod == "AM") ? eventsArr['AM'] : eventsArr['PM']
	eventPeriodList.sort(propertySort('mstime'))
	eventPeriodList.map((event, i) => {
		var eventDivHTMTL = 
		`<div class=schedule-event id=event${i} style="background-color: ${event.style.background}" >
			<div class="schedule-event-time" id="schedule-event-time-${i}" style="color: ${event.style.time}">${event.eventTime}</div>
			<div class="schedule-event-title" id="schedule-event-title-${i}" style="color: ${event.style.title}">${event.eventTitle}</div>
			<div class="schedule-event-desc" id="schedule-event-desc-${i}" style="display: none; color: ${event.style.title}">${event.desc}</div>
		</div>`
		$('#schedule-event-cnt').append(eventDivHTMTL)
	});
}

function alertUpcomingEvent() {
	var eventPeriodList = (timePeriod == "AM") ? eventsArr['AM'] : eventsArr['PM']
	eventPeriodList.sort(propertySort('mstime'))


	var recentEvent = eventPeriodList[0].mstime
	//used to gget secondsssssss
	var recEvent = new Date(recentEvent)
	var getDate = recentEvent.split("T")
	var eventDate = getDate[0]
	var currentDate = new Date()
	// formatting for comparison yyyy-mm-dd
	var curDate = currentDate.toISOString().split('T')[0]

	// todays date -> check time
	if(curDate === eventDate) {
		//check if event is less than 1 hr
		if((recEvent.getTime - currentDate.getTime()) < 36e5) {
			sendCommand("alert 4")
		}
	
	}

}
function drawPieChart() {

	console.log(eventsArr)

	pieDataArr = [['Events', 'Time']];
	sliceColours = {};

	var eventPeriodList = (timePeriod == "AM") ? eventsArr['AM'] : eventsArr['PM']

	var j = 0;
	// fill pieDataArr from hour 0 to 12
	var bestSlice = false;
	var pieHour = 0;
	var endTime12;
	eventPeriodList.map((event, i) => {
		var startTime12 = event.pieChartTime.start;
		var endTime12 = event.pieChartTime.end;
		var lengthTime12 = event.pieChartTime.length;
		var eventTitle = event.eventTitle;


		console.log("event: ", eventTitle)
		console.log("startTime12: ", startTime12, " endTime12: ", endTime12)
		console.log("lengthTime12: ", lengthTime12)		


		if (startTime12 > pieHour) {
			pieDataArr.push(["Blank Slot", startTime12 - pieHour ]);
			sliceColours[j] = { color: 'transparent' };
			j++;
		}
		if (i == 0) {
			
			selectedSlice = j;
		}

		pieDataArr.push([eventTitle, lengthTime12]);
		sliceColours[j] = { color: event.style.background};

		// select the first upcoming event
		if(endTime12 > localTime12 && !bestSlice) {
			selectedSlice = j;
			bestSlice = true;
			sliceColours[j] = { color: event.style["background-active"]};
			selectedEvent = i;
			$(`#event${selectedEvent}`).css('background-color', event.style["background-active"]);
		}
		j++;
		pieHour = endTime12;
	});

	if (pieHour < 12) {
		pieDataArr.push(["Blank Slot", 12 - pieHour ]);
		sliceColours[j] = { color: 'transparent' };
		j++;
	}
	console.log(pieDataArr)

	chartData = google.visualization.arrayToDataTable(pieDataArr);

	var height = $('#schedule-cnt').height();
	var width = $('#piechart').width();

	$('#schedule-cnt').height(height);

	$('#clock-cnt').height(width);
	$('#clock-cnt').width(width);

	var pieRelHeight = 0.99 // % of cnt

	var pieHeight = width*pieRelHeight;
	var pieRelPos = width*(1-pieRelHeight)/2

	$('#piechart').height(pieHeight);
	$('#piechart').width(pieHeight);

	// overlay the clock on top of the chart
	var piechartPos = $('#clock-cnt').offset();
	$('#clock-img').height(width)
	$('#clock-img').css(piechartPos)

	$('#piechart').css('position', 'absolute')
	$('#piechart').css({top: piechartPos.top + pieRelPos, left: piechartPos.left + pieRelPos})
	console.log(piechartPos)

	// draw the clock (hours)

	for(var i = 1; i <= 12; i++) {
		var fontSize = 18;
		var deg = i*30
		$(`#clock-hour${i}`).css({top: piechartPos.top + pieRelPos, left: piechartPos.left + pieRelPos + pieHeight/2 - fontSize})
		$(`#clock-hour${i}`).height(pieHeight)
		$(`#clock-hour${i}`).css({'transform' : `rotate(${deg}deg)`});
	}

	$('#hour-hand').width(pieHeight/2)
	$('#hour-hand').css({top: piechartPos.top + pieRelPos + pieHeight/2, left: piechartPos.left + pieRelPos})
	// update the clock hour hand
	// https://dev.to/code_mystery/simple-analog-clock-using-html-css-javascript-2c6a
	$('#hour-hand').css({'transform' : 'rotate('+ hourDegrees +'deg)'});
	var hourDegrees = ((localHour / 12) * 360) + ((localMin/60)*30) + 90;
	$('#hour-hand').css({'transform' : 'rotate('+ hourDegrees +'deg)'});


	options = {
		legend: 'none',
		chart: {
			title: 'time',
			subtitle: 'is a valuable thing'
		  },
		chartArea: { 
			backgroundColor: {stroke: 'red', strokeWidth: 2},
			height: 1000,
			top: 0, 
			left: 0,
			right: 0,
		},
		pieSliceText : 'none',
		slices: sliceColours,
		backgroundColor: 'none',
	  };
	  
	var pieChartElement = document.getElementById('piechart')
	chart = new google.visualization.PieChart(pieChartElement);
	// Wait for the chart to finish drawing before calling the getImageURI() method.
	google.visualization.events.addListener(chart, 'select', function () {
		console.log('select trig')
	});

	chart.draw(chartData, options);
}


// sends command to server for status updates and commands for bbb
function sendCommand(message) {
	if (socket.socket.connected) {
		socket.emit('bbg', message);
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

	var startHour = (timePeriod == "AM") ? 0 : 12;
	var endHour = (timePeriod == "AM") ? [12, 0] : [23, 59];

	var startDate = new Date();
	var endDate = new Date();
	console.log(startDate, " ",endDate)

	startDate.setHours(startHour)
	endDate.setHours(endHour[0], endHour[1])

	// socket.connected for v0.9	
	if (socket.socket.connected) {
		for(var i = 0; i < calendarNames.length; i++) {
			// send request with local time + range
			socket.emit('calendar-events', { calendarName: calendarNames[i], startDate: startDate.toISOString(), endDate: endDate.toISOString()});
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
  
function handlePotChange(sector){
	if(sector == 0){
		return;
	}
	if(sector > currPotReading){
		updateSelectedEvent("down");
		currPotReading = sector;
	}else if(sector < currPotReading){
		updateSelectedEvent("up");
		currPotReading = sector;
	}
}

function handleScreenButtonPressed(buttonPressed){
	if(buttonPressed == 1){
		var newViewMode = (viewMode + 1) % 3;
		handleViewChange(newViewMode);
	}else{
		return;
	}	
}

// changes the view mode (bbg button)
function handleViewChange(view) {
	viewMode = view
	// default with calendar
	if (view == 0) {
		$('body').css('background-color', 'black');
		$('#cnt-all').css('display', 'revert')
		$('#light-border').css('display', 'none')

		
	// blank screen
	} else if (view == 1) {
		$('body').css('background-color', 'black');
		$('#cnt-all').css('display', 'none')
		$('#light-border').css('display', 'none')

	// white border
	} else if (view == 2) {
		$('body').css('background-color', 'white');
		$('#cnt-all').css('display', 'none')
		$('#container').css('display', 'none')
		$('#light-border').css('display', 'revert')
		$('#light-border').css('background-color', 'black')
		$('#light-border').css('padding', '90%')
	}
}

// update the selected event; up or down (bbg pot)
function updateSelectedEvent(dir) {
	var eventPeriodList = (timePeriod == "AM") ? eventsArr['AM'] : eventsArr['PM']
	var numEvents = eventPeriodList.length;

	var eventDescObj = $('#schedule-event-desc-' + selectedEvent)
	eventDescObj.css('display', 'none')
	chart.setSelection([{row: selectedSlice, column: null}]);
	var newColour = eventPeriodList[selectedEvent].style["background"];

	sliceColours[selectedSlice] = {color: newColour};
	options.slices = sliceColours;

	$(`#event${selectedEvent}`).css('background-color', newColour);

	if (dir === 'up') {
		selectedEvent = selectedEvent+numEvents-1
		
	} else if (dir === 'down') {
		selectedEvent = selectedEvent+1
	}
	selectedEvent = (selectedEvent) % numEvents; 
	eventDescObj = $('#schedule-event-desc-' + selectedEvent)
	eventDescObj.css('display', 'revert')

	var j = 0;
	for(var i = 1; i < pieDataArr.length; i++) {
		if (pieDataArr[i][0] != "Blank Slot") {
			j++;
		}
		
		if(j == selectedEvent+1) {
			console.log("next slice ", i)
			console.log("non blanks ", j)
			chart.setSelection([{row: i-1, column: null}]);
			selectedSlice = i-1;
			break;
		}
	}

	// highlight the segment and redraw the chart with new colours
	chart.setSelection([{row: selectedSlice, column: null}]);
	newColour = eventPeriodList[selectedEvent].style["background-active"];
	sliceColours[selectedSlice] = {color: newColour};

	$(`#event${selectedEvent}`).css('background-color', newColour);

	options.slices = sliceColours;
	chart.draw(chartData, options);
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
