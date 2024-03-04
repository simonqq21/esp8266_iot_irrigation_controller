/*
TODO:
web browser interaction
clicking on the activate pump button activates the pump momentarily
*/

let gateway = `ws://${window.location.hostname}:5555/ws`; 
// let gateway = `ws://192.168.5.75:5555/ws`; 
let websocket
let debug = true; 

// status variables 
let autoEnabled, relayStatus;
let timingConfig = {
    'timeslots': [2,0,0],
    'duration': 0,
    'gmt_offset': 8
}

/*
################################################################################
Websocket related functions
*/
function initWebSocket() {
    // alert('Websocket initializing');
    websocket = new WebSocket(gateway);
    websocket.onopen = onOpen; 
    websocket.onclose = onClose; 
    websocket.onmessage = onMessage;
}
// runs when websocket opens
function onOpen(event) {
    // alert('Connection opened');
    // JSON to request for a status update
    requestStatus();
}
// runs when websocket closes
function onClose(event) {
    // alert('Connection closed');
    setTimeout(initWebSocket, 2000); // restart websocket
}
// runs when websocket receives message from server
function onMessage(event) {
    // console.log(event.data);
    msg = JSON.parse(event.data);
    let msgType = msg['type'];
    if (debug) {console.log(msg);}
    // update status 
    if (msgType == 'status') {
        receiveStatus(msg);
    }
    // update settings
    else if (msgType == 'settings') {
        receiveSettings(msg);   
    }
} 

// request status from the MCU
async function requestStatus() {
    let jsondata = {'type': 'status'}
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("requestStatus - failed to connect to websockets");
    }
}

// request settings from the MCU 
async function requestTimingConfig() {
    let jsondata = {'type': 'settings'}
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("requestTimingConfig - failed to connect to websockets");
    }
}

// toggle the automatic timer of the MCU
async function toggleTimerEnable() {
    autoEnabled = !autoEnabled;
    let jsondata = {'type': 'auto',
        'auto_enabled': autoEnabled};
    if (debug) {console.log(jsondata);}
    try {
        await websocket.send(JSON.stringify(jsondata));
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
    } catch (error) {
        console.log("setRelay - failed to connect to websockets");
    }
}

/* 
close the relay for a specified amount of time 
*/
function closeRelay() {
    setRelay(true);
    setTimeout(setRelay, timingConfig.duration, false);
}

// check if device has a touchscreen
function isTouchEnabled() {
    return ('ontouchstart' in window) || 
        (navigator.maxTouchPoints > 0) || 
        (navigator.msMaxTouchPoints > 0);
}

function receiveStatus(jsonMsg) {
    autoEnabled = jsonMsg["auto_enabled"];
    relayStatus = jsonMsg["relay_status"];
    loadRelayStatus();
    loadTimerEnableStatus();
}

function receiveSettings(jsonMsg) {
    timingConfig.timeslots = jsonMsg["timeslots"];
    timingConfig.duration = jsonMsg["duration"];
    timingConfig.gmt_offset = jsonMsg["gmt_offset"]; 
    loadAllTimeslotsDisplay();
    loadDurationDisplay();
    loadGMTOffset();
}

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

/*
################################################################################
UI creator functions
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
UI updater functions
*/
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
    let curTimeslotVal = checkTimeslot(timeslot);
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
    let curTimeslotVal = checkTimeslot(timeslot);
    setTimeslot(timeslot, !curTimeslotVal);
    console.log(curTimeslotVal);
    console.log(timingConfig.timeslots);
    loadAllTimeslotsDisplay(timeslot);
}

function checkTimeslot(timeslot) {
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
    // alert(timingConfig.gmt_offset);
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

$(document).ready(function() {
    createTimeslotButtons();

    // initialize websocket 
    initWebSocket();

    // testing 
    // closeRelay();

    // set the callback functions here 
    
    // toggle timer enable 
    $("#timerEnable").click(function() {
        toggleTimerEnable();
    });
    // manually close the relay
    $("#closeRelayBtn").click(function() {
        closeRelay();
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
    });

    loadAllElements();

    // set the intervals here 
    setInterval(requestStatus, 500);
    setInterval(requestTimingConfig, 10000);
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

