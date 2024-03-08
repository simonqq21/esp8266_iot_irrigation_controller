/*
Modules:
    send and receive messages from server
    update the user interface 
    set callbacks to modifications on inputs
*/

import * as wsM from "./wsModule.mjs";

// status variables 
let relayStatus, autoEnabled, useNTP;
let timingConfig = {
    'timeslots': [2,0,0],
    'duration': 0,
    'gmt_offset': 8
}
let maxDuration = 20;

let popupTimeout;
let setRelayTimeout; 

/*
################################################################################
Model
*/




// get time from JSON message
function receiveTime(jsonMsg) {
    let year = String(jsonMsg.year).padStart(4, '0');
    let month = String(jsonMsg.month).padStart(2, '0');
    let day = String(jsonMsg.day).padStart(2, '0');
    let hour = String(jsonMsg.hour).padStart(2, '0');
    let min = String(jsonMsg.min).padStart(2, '0');
    let sec = String(jsonMsg.sec).padStart(2, '0');
    // update time in webpage 
    setTime(year, month, day, hour, min, sec);
}

function receiveStatus(jsonMsg) {
    relayStatus = jsonMsg["relay_status"];
    useNTP = jsonMsg[""];
    autoEnabled = jsonMsg["use_ntp"];
    loadRelayStatus();
    loadUseNTPStatus();
    loadTimerEnableStatus();
}

function receiveSettings(jsonMsg) {
    console.log(`jsonMsg tC = ${JSON.stringify(jsonMsg)}`);
    timingConfig.timeslots = jsonMsg["timeslots"];
    timingConfig.duration = jsonMsg["duration"];
    timingConfig.gmt_offset = jsonMsg["gmt_offset"]; 
    loadAllTimeslotsDisplay();
    loadDurationDisplay();
    loadGMTOffset();
}

function getTimeslot(timeslot) {
    let byteIndex = parseInt(timeslot / 8);
    let bitIndex = parseInt(timeslot % 8);
    let status = (timingConfig.timeslots[byteIndex] >> bitIndex) & 1;
    return status;
}

function setTimeslot(timeslot, state) {
    let byteIndex = parseInt(timeslot / 8); 
    let bitIndex = parseInt(timeslot % 8);
    let mask = 1 << bitIndex;
    console.log(`mask=${mask}`);
    if (state) {
        timingConfig.timeslots[byteIndex] = timingConfig.timeslots[byteIndex] | mask;
    }
    else {
        timingConfig.timeslots[byteIndex] = timingConfig.timeslots[byteIndex] & ~mask;
    }
}

function setDuration(duration) {
    console.log('set duration');
    timingConfig.duration = duration; 
    refreshDurationDisplay();
}

function setGMTOffset(offset) {
    timingConfig.gmt_offset = offset;
}


/*
################################################################################
View
*/
function createTimeslotButtons() {
    for (let i=0;i<24;i++) {
        let newTimeslotBtn = $('<button>', {id: `timeBtn${i}`, class: "timeBtn"});
        let newTIndex = $('<span>', {class: "tIndex"});
        let newTState = $('<span>', {class: "tState"});
        $(newTIndex).text(i);
        $(newTState).text('Off');
        $(newTimeslotBtn).append(newTIndex);
        $(newTimeslotBtn).append(newTState);
        $('.irrigationScheduleRow').append(newTimeslotBtn);
    }
}

/*
################################################################################
Controller
*/
// toggle the automatic timer of the MCU
async function toggleTimerEnable() {
    autoEnabled = !autoEnabled;
    let jsondata = {'type': 'timer_auto',
        'auto_enabled': autoEnabled};
    if (debug) {console.log(jsondata);}
    try {
        await websocket.send(JSON.stringify(jsondata));
        showPopup(`Set auto timer to ${autoEnabled}.`);
    } catch (error) {
        console.log("toggleTimerEnable - failed to connect to websockets");
    }
    finally {
        loadTimerEnableStatus();
    }
}

// send updated settings to the MCU 
async function updateSettings() {
    // get the various settings from the DOM
    let jsondata = {'type': 'chg_settings',
        'timeslots': timingConfig.timeslots,
        'duration': timingConfig.duration,
        'gmt_offset': timingConfig.gmt_offset};
    try {
        await websocket.send(JSON.stringify(jsondata));
        showPopup("Settings saved successfully.");
    } catch (error) {
        console.log("updateSettings - failed to connect to websockets");
    }
}

/*
manually set the relay for the set duration.
*/
async function setRelay(state) {
    let jsondata = {'type': 'relay',
        'relay_status': state};
    console.log(jsondata);
    try {
        await websocket.send(JSON.stringify(jsondata));
        showPopup(`Set relay to ${state}.`);
        if (state) {
            setRelayTimeout = setTimeout(setRelay, timingConfig.duration*1000, false);
        }
        else {
            clearTimeout(setRelayTimeout);
        }
    } catch (error) {
        console.log("setRelay - failed to connect to websockets");
    }
}

// update time in webpage 
function setTime(year, month, day, hour, minute, second) {
    let timeStr = `${year}/${month}/${day} ${hour}:${minute}:${second}`;
    console.log(timeStr);
    $("#time").text(timeStr);
}

// show popup with text 
function showPopup(text) {
    clearTimeout(popupTimeout);
    $("#popup").show();
    $("#popupText").text(text);
    popupTimeout = setTimeout(hidePopup, 3000);
}

// hide popup
function hidePopup() {
    $("#popup").hide();
}

// load all timeslots and display on the webpage
function loadAllTimeslotsDisplay() {
    for (let i=0;i<24;i++) {
        loadTimeslotState(i);
    }
}

function loadTimeslotState(timeslot) {
    // let timeslot = parseInt($(clickedTimeslot).find('.tIndex').text());
    // console.log(timeslot);
    let clickedTimeslot = $(`#timeBtn${timeslot}`);
    let tState = $(clickedTimeslot).find('.tState');
    let curTimeslotVal = getTimeslot(timeslot);
    if (curTimeslotVal) {
        $(clickedTimeslot).addClass('enabledBtn');
        $(clickedTimeslot).removeClass('disabledBtn');
        $(tState).text("On");
    }
    else {
        $(clickedTimeslot).addClass('disabledBtn');
        $(clickedTimeslot).removeClass('enabledBtn');
        $(tState).text("Off");
    }
}

function clickTimeslot(event) {
    let clickedTimeslot = $(event.currentTarget);
    let timeslot = parseInt($(clickedTimeslot).find('.tIndex').text());
    let curTimeslotVal = getTimeslot(timeslot);
    setTimeslot(timeslot, !curTimeslotVal);
    console.log(curTimeslotVal);
    console.log(timingConfig.timeslots);
    loadAllTimeslotsDisplay(timeslot);
}

// load all values into display upon webpage load
function loadAllElements() {
    loadTimerEnableStatus();
    loadRelayStatus();
    loadAllTimeslotsDisplay();
    loadDurationDisplay();
    // loadMaxDurationDisplay();
    loadGMTOffset();
    refreshDurationDisplay();
    refreshMaxDurationDisplay();
}

function loadUseNTPStatus() {
    if (useNTP) {
        $("#useNTP").prop('checked', true);
        $("#userDateTimeDiv").hide();
    }
    else {
        $("#useNTP").prop('checked', false);
        $("#userDateTimeDiv").show();
    }
}

function loadTimerEnableStatus() {
    if (autoEnabled) {
        $("#timerEnable").text('Enabled');
    }
    else {
        $("#timerEnable").text('Disabled');
    }
}

// load relay status and display on the webpage
function loadRelayStatus() {
    if (relayStatus) {
        $("#irrigationStatusIndicator").addClass("enabledBtn");
        $("#irrigationStatusIndicator").removeClass("disabledBtn");
    }
    else {
        $("#irrigationStatusIndicator").addClass("disabledBtn");
        $("#irrigationStatusIndicator").removeClass("enabledBtn");
    }
} 

// load duration and display on the webpage
function loadDurationDisplay() {
    $("#intervalDuration").val(timingConfig.duration);
    refreshDurationDisplay();
}

// load GMT offset and display on the webpage
function loadGMTOffset() {
    $("#GMTOffset").val(timingConfig.gmt_offset);
}


// // check if device has a touchscreen
// function isTouchEnabled() {
//     return ('ontouchstart' in window) || 
//         (navigator.maxTouchPoints > 0) || 
//         (navigator.msMaxTouchPoints > 0);
// }



























// 
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

















function refreshDurationDisplay() {
    $("#intervalDurationDisplay").text($("#intervalDuration").val());
}

function refreshMaxDurationDisplay() {
    let maxDurationVal = parseInt($("#maxIntervalDuration").val());
    let curDuration = timingConfig.duration;

    $('#intervalDuration').attr('max', maxDurationVal);

    if (curDuration > maxDurationVal) {
        setDuration(maxDurationVal);
        loadDurationDisplay();
    }
}

async function setUseNTP(event) {
    let clicked = $(event.target);
    useNTP = $(clicked).prop('checked');
    loadUseNTPStatus();
    // send value to MCU 
    let jsondata = {
        'type': 'ntp',
        'use_ntp': useNTP
    };
    if (debug) {console.log(jsondata);}
    try {
        await websocket.send(JSON.stringify(jsondata));
        showPopup(`Set use_NTP to ${useNTP}.`);
    } catch (error) {
        console.log("setUseNTP - failed to connect to websockets");
    }
}

$(document).ready(async function() {
    createTimeslotButtons();

    // wait for websocket to initialize
    wsM.initWebSocket();

    $("#maxIntervalDuration").val(maxDuration);
    refreshMaxDurationDisplay();

    // set the callback functions here 
    // toggle NTP 
    $("#useNTP").on('change', function(event) {
        setUseNTP(event);
        
    });
    // set user date and time to ESP8266
    $("#userDateTime").on('change', function() {
        alert($("#userDateTime").val());
    });
    // toggle timer enable 
    $("#timerEnable").click(function() {
        toggleTimerEnable();
    });
    // manually close the relay
    $("#closeRelayBtn").click(function() {
        setRelay(true);
    });
    // manually open the relay
    $("#openRelayBtn").click(function() {
        setRelay(false);
    });
    // toggle each timeslot in the schedule
    $(".timeBtn").click(function(event) {
        clickTimeslot(event);
    });
    // set the watering duration every time the relay is closed
    $("#intervalDuration").on('change', function() {
        setDuration($("#intervalDuration").val());
    });
    // set the interval duration 
    $("#intervalDuration").on('input', function() {
        refreshDurationDisplay();
    });
    // set the maximum interval duration 
    $("#maxIntervalDuration").on('change', function() {
        refreshMaxDurationDisplay();
    });
    // adjust the GMT offset 
    $("#GMTOffset").on('change', function() {
        setGMTOffset($("#GMTOffset").val());
    });
    // save settings to the ESP
    $("#saveBtn").click(function() {
        updateSettings();
        requestTimingConfig();
    });

    

    // set the intervals here 
    setInterval(wsM.requestStatus, 500);
    setInterval(wsM.requestTime, 500);
});

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

