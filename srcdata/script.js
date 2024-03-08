/*
Modules:
    websocketModule - send and receive messages from server via websockets
    callbackModule - set callbacks to modifications on inputs 
    uiControllerModule - create and update the user interface 
    configModule - get and set the configuration values into global variables in 
        the JS code
    
*/
import * as wsModule from "./websocketModule.mjs";
import * as cbModule from "./callbackModule.mjs";
import * as uicModule from "./uiControllerModule.mjs";
import * as cfgModule from "./configModule.mjs";

$(document).ready(async function() {
    createTimeslotButtons();

    // wait for websocket to initialize
    wsModule.initWebSocket();

    $("#maxIntervalDuration").val(maxDuration);
    refreshMaxDurationDisplay();

    // set the callback functions here 
    // toggle NTP 
    $("#useNTP").on('change', function(event) {
        changeUseNTP(event);
    });
    // set user date and time to ESP8266
    $("#userDateTime").on('change', function(event) {
        changeUserDateTime(event);
        
    });
    // toggle timer enable 
    $("#timerEnable").click(function(event) {
        clickTimerEnable();
    });
    // manually close the relay
    $("#closeRelayBtn").click(function(event) {
        clickCloseRelayBtn(true);
    });
    // manually open the relay
    $("#openRelayBtn").click(function(event) {
        clickOpenRelayBtn(false);
    });
    // toggle each timeslot in the schedule
    $(".timeBtn").click(function(event) {
        clicktimeBtn(event);
    });
    // set the interval duration 
    $("#intervalDuration").on('input', function(event) {
        inputIntervalDuration(event);
        
    });
    // set the watering duration every time the relay is closed
    $("#intervalDuration").on('change', function(event) {
        changeIntervalDuration(event);
    });
    // set the maximum interval duration 
    $("#maxIntervalDuration").on('change', function(event) {
        changeMaxIntervalDuration(event);
        
    });
    // adjust the GMT offset 
    $("#GMTOffset").on('change', function(event) {
        changeGMTOffset(event);
    });
    // save settings to the ESP
    $("#saveBtn").click(function(event) {
        clickSaveBtn(event);
    });

    // set the intervals here 
    setInterval(wsModule.requestStatus, 500);
    setInterval(wsModule.requestTime, 500);
});

// // check if device has a touchscreen
// function isTouchEnabled() {
//     return ('ontouchstart' in window) || 
//         (navigator.maxTouchPoints > 0) || 
//         (navigator.msMaxTouchPoints > 0);
// }

// check if touch is inside the bounding box of the element
// function isTouchInsideElement(event, element) {
//     const rect = element.getBoundingClientRect();
//     return (
//         event.touches[0].clientX >= rect.left &&
//         event.touches[0].clientX <= rect.right &&
//         event.touches[0].clientY >= rect.top &&
//         event.touches[0].clientY <= rect.bottom
//     );
// }

/*
15 minute intervals 
60/15*24 = 96 bits - 12 bytes
bit can range from 0-95 
7:30
(7+30/60)/24 = 0.3125*96=30th bit
12:00
(12+0/60)/24=0.5*96=48th bit 
00:00
0/24=0*96=0th bit 
23:50 
floor((23+50/60)/24*96)=95
*/

