const months = [
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
 
 const days = [
    "Sunday",
    "Monday ",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
 ];

$(document).ready(function() {

    window.setInterval(function() {getLocalDate()}, 2000);

});


function getLocalDate() {
    var localDate = new Date();
    var weekday = days[localDate.getDay()];
    var month = months[localDate.getMonth()];
    var day = localDate.getDate();
    var hour = localDate.getHours(); //returns value 0-23 for the current hour
    var min = localDate.getMinutes(); //returns value 0-59 for the current minute of the hour

    var text = String(hour + ':' + min);

    $('#time-numeric').text = "he";

    console.log(hour + ':' + min);
}