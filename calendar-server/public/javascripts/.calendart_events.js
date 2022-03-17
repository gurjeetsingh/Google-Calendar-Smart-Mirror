"use strict";
import {eventsArr} from '../calendar-api/index.js'
// Client-side interactions with the browser.

// Make connection to server when web page is fully loaded.
var socket = io.connect();

$(document).ready(function() {
    for(var i = 0; i < eventsArr.length; i++) {
      $('.schedule-cnt')
      .append('<div class=schedule-event-cnt id=event"' + i +'">' + eventsArr[i] + '</div>')
      console.log(eventsArr[i])
    }
  
  })
  