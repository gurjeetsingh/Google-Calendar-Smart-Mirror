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


var chart;

var eventsArr = { 
	AM : [],
	PM: []
}
var selectedEvent = 0;
var selectedSlice = 0;
// var eventsTitle = []

var calendarNames = [];
var calendarColours = [];

var timePeriod = "AM";

var pieDataArr;
var sliceColours;

var options;
var chartData;

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
	// chart.setSelection([e]);
	// google.visualization.events.trigger(this, 'select', {});
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
			var startTime12 = parseInt(t24to12Hour(startHour)) + (startMin/60);
			var endTime12 = parseInt(t24to12Hour(endHour)) + (endMin/60);
			
			// if (timePeriod == "PM") {
			// 	if (endTime12 < 12) {
			// 		endTime12 = 24
			// 	}
			// 	startTime12 -= 12;
			// 	endTime12 -= 12;
			// }
			console.log("startTime12: ", startTime12, " endTime12: ", endTime12)
			var pieChartTime = {start: startTime12,
								end: endTime12,
								length: Math.abs(endTime12 - startTime12) 
								}
			

			var eventColours = eventStyles[colourName];


			var eventPeriodList = (timePeriod == "AM") ? eventsArr['AM'] : eventsArr['PM']
			eventPeriodList.push({ mstime: event.start.dateTime, eventTime: eventTime, pieChartTime: pieChartTime, 
				eventTitle: eventTitle, desc: event.description, 
				style: eventColours, colourName: colourName});
			
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
    var hour = localDate.getHours(); //returns value 0-23 for the current hour
    var min = localDate.getMinutes(); //returns value 0-59 for the current minute of the hour


	if (hour < 12) {
		$('#time-period').text("AM");
		if (hour == 0) {
			hour = 12;
		}	
		timePeriod = "AM";
	} else {
		$('#time-period').text("PM");
		if (hour > 12) {
			hour -= 12;
		}
		timePeriod = "PM";
	}

	// if (min < 10) { 
	// 	min = '0' + String(min);
	// }

	
    var text = convertToStringTime(hour, min);
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
function drawPieChart() {
	// eventsArr.sort(propertySort('mstime'))



	console.log(eventsArr)

	pieDataArr = [['Events', 'Time']];
	sliceColours = {};

	var eventPeriodList = (timePeriod == "AM") ? eventsArr['AM'] : eventsArr['PM']

	var j = 0;
	// fill pieDataArr from hour 0 to 12
	var pieHour = 0;
	eventPeriodList.map((event, i) => {
		var currStart = event.pieChartTime.start;
		console.log("piechart start: ", pieHour, "event start: ", currStart)
		if (currStart > pieHour) {
			pieDataArr.push(["Blank Slot", currStart - pieHour ]);
			sliceColours[j] = { color: 'transparent' };
			j++;
		}
		if (i == 0) {
			// to-do: select the first upcoming event
			selectedSlice = j;
		}
		pieDataArr.push([event.eventTitle, event.pieChartTime.length]);
		sliceColours[j] = { color: event.style.background};
		j++;
		pieHour = event.pieChartTime.end;
	});

	console.log(pieDataArr)

	chartData = google.visualization.arrayToDataTable(pieDataArr);

	


	console.log("og height");
	  console.log($('#schedule-cnt').height());

	  var height = $('#schedule-cnt').height();
	  var width = $('#piechart').width();

	  $('#schedule-cnt').height(height);
	//   $('#schedule-cnt').width(height);
	$('#piechart').height(width);
	  console.log(typeof(height));
	  console.log(height + ' ' + width);

	  options = {
		legend: 'none',
		chart: {
			title: 'time',
			subtitle: 'is a valuable thing'
		  },
		chartArea: { 
			backgroundColor: {stroke: 'red', strokeWidth: 2},
			// 'backgroundColor': {
			// 	'fill': '#F4F4F4',
			// 	'opacity': 100
			//  },
			height: 1000,
			top: 10, 
			left:10,
			right: 10,
		},
		tooltip:{trigger : 'selection', isHtml: true, text: 'none', width: 20, textStyle: { fontSize: 18,
		bold: true}},
		// chartArea: { backgroundColor: '#f1f7f9' },
		// height: height + 100,
		pieSliceText : 'none',
		slices: sliceColours,
		backgroundColor: 'none',
		

	  };
	  
	  var pieChartElement = document.getElementById('piechart')
	  chart = new google.visualization.PieChart(pieChartElement);
      // Wait for the chart to finish drawing before calling the getImageURI() method.
      google.visualization.events.addListener(chart, 'select', function () {
        // pieChartElement.innerHTML = '<img src="' + chart.getImageURI() + '">';
		// chart.setSelection([{row: 1, column: null}]);
		// chart.draw(chartData, options);
		console.log('select trig')


      });
	  chart.draw(chartData, options);
}


	// var pieChart;
	// function drawPieChart() {
	//   // Create and populate the data table.
	//   var data = new google.visualization.DataTable();
	//   data.addColumn('string', 'Task');
	//   data.addColumn('number', 'Hours per Day');

	//   var sliceColours = {};

	//   var eventPeriodList = (timePeriod == "AM") ? eventsArr['AM'] : eventsArr['PM']
  
	//   var j = 0;
	//   var pieHour = 0;
	//   // fill pieDataArr from hour 0 to 12
	// //   data.addRows(eventPeriodList.length + 5);
	// //   eventPeriodList.map((event, i) => {
	// // 	  var currStart = event.pieChartTime.start;
	// // 	  console.log("piechart start: ", pieHour, "event start: ", currStart)
	// // 	  if (currStart > pieHour) {
	// // 		//   pieDataArr.push(["Blank Slot", currStart - pieHour ]);

	// // 		  sliceColours[j] = { color: 'transparent' };
	// // 		  data.setValue(j, 0, 'blankslot');
	// // 		  data.setValue(j, 1, currStart - pieHour);
	// // 		  j++;
	// // 	  }
	// // 	//   pieDataArr.push([event.eventTitle, event.pieChartTime.length]);
	// // 	  sliceColours[j] = { color: event.style.background};
	// // 	  data.setValue(j, 0, event.eventTitle);
	// // 	  data.setValue(j, 1, currStart - pieHour);
	// // 	  j++;
	// // 	  pieHour = event.pieChartTime.end;
	// //   });
  
	//   data.addRows(5);
	//   data.setValue(0, 0, 'Work');
	//   data.setValue(0, 1, 11);
	//   data.setValue(1, 0, 'Eat');
	//   data.setValue(1, 1, 2);
	//   data.setValue(2, 0, 'Commute');
	//   data.setValue(2, 1, 2);
	//   data.setValue(3, 0, 'Watch TV');
	//   data.setValue(3, 1, 2);
	//   data.setValue(4, 0, 'Sleep');
	//   data.setValue(4, 1, 7);

	//   // Create and draw the visualization.
	//   pieChart = new google.visualization.PieChart(document.getElementById('piechart'));
	//   pieChart.draw(data, {legend:'none'});
	//   google.visualization.events.addListener(pieChart, 'ready', 
	// 	readyTest);  
	// }
	// function readyTest(){
	//   pieChart.setSelection([{row:0}]);
	// }

// 	var pieChart;
// 	function drawPieChart() {
// 	  // Create and populate the data table.
// 	  var data = new google.visualization.DataTable();
// 	  data.addColumn('string', 'Task');
// 	  data.addColumn('number', 'Hours per Day');
// 	  data.addRows(5);
// 	  data.setValue(0, 0, 'Work');
// 	  data.setValue(0, 1, 11);
// 	  data.setValue(1, 0, 'Eat');
// 	  data.setValue(1, 1, 2);
// 	  data.setValue(2, 0, 'Commute');
// 	  data.setValue(2, 1, 2);
// 	  data.setValue(3, 0, 'Watch TV');
// 	  data.setValue(3, 1, 2);
// 	  data.setValue(4, 0, 'Sleep');
// 	  data.setValue(4, 1, 7);

// 	  // Create and draw the visualization.
// 	  pieChart = new 
// google.visualization.PieChart(document.getElementById('piechart'));
// 	  pieChart.draw(data);
// 	  google.visualization.events.addListener(pieChart, 'ready', 
// readyTest);  
// 	}
// 	function readyTest(){
// 	  pieChart.setSelection([{row:0}]);
// 	}

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

	var startHour = (timePeriod == "AM") ? 0 : 12;
	var endHour = (timePeriod == "AM") ? [12, 0] : [23, 59];

	// socket.connected for v0.9	
	if (socket.socket.connected) {
		for(var i = 0; i < calendarNames.length; i++) {
			socket.emit('calendar-events', { calendarName: calendarNames[i], startHour: startHour, endHour: endHour});
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
	var eventPeriodList = (timePeriod == "AM") ? eventsArr['AM'] : eventsArr['PM']
	var numEvents = eventPeriodList.length;

	var eventDescObj = $('#schedule-event-desc-' + selectedEvent)
	// var piechartObj = $('#piechart')
	// var eventColour = eventDescObj.css()
	eventDescObj.css('display', 'none')


	
	chart.setSelection([{row: selectedSlice, column: null}]);
	var newColour = eventPeriodList[selectedEvent].style["background"];
	console.log('old color', sliceColours[selectedSlice]);
	console.log('new color', newColour)
	sliceColours[selectedSlice] = {color: newColour};
	console.log(sliceColours)
	options.slices = sliceColours;

	$(`#event${selectedEvent}`).css('background-color', newColour);

	// chart.setSelection([{row: selectedEvent+1, column: null}]);
	// var pieChartElement = document.getElementById('piechart')
	// console.log(pieChartElement)
	// var pieSliceElements = pieChartElement.getElementsByTagName('g')
	// console.log(pieSliceElements[1])

	// var sliceObjs = $('g');

	// sliceObjs.each(function(index, obj){
	// 	console.log(obj);
	// });

	// console.log("slices")
	// console.log(sliceObjs)
	// console.log($('g'))

	// console.log(sliceObjs[1])

	
	
	
	if (dir === 'up') {
		selectedEvent = selectedEvent+numEvents-1
		
	} else if (dir === 'down') {
		selectedEvent = selectedEvent+1
	}
	selectedEvent = (selectedEvent) % numEvents; 

	eventDescObj = $('#schedule-event-desc-' + selectedEvent)

	console.log('selected event #schedule-event-desc-' + selectedEvent)
	eventDescObj.css('display', 'revert')
	console.log(pieDataArr)

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
	chart.setSelection([{row: selectedSlice, column: null}]);
	newColour = eventPeriodList[selectedEvent].style["background-active"];
	console.log('old color', sliceColours[selectedSlice]);
	console.log('new color', newColour)
	sliceColours[selectedSlice] = {color: newColour};

	$(`#event${selectedEvent}`).css('background-color', newColour);

	console.log(sliceColours)
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
