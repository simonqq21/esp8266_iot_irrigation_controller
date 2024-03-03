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
    'timeslots': [0,0,0],
    'duration': 0,
    'gmt_offset': 8
}

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
    if (debug) {console.log(msgType);}
    // // update status 
    // if (type == 'status') {

    // }
    // // update settings
    // else if (type == 'settings') {

    // }
} 

// check if device has a touchscreen
function isTouchEnabled() {
    return ('ontouchstart' in window) || 
        (navigator.maxTouchPoints > 0) || 
        (navigator.msMaxTouchPoints > 0);
}

// request status from the MCU
function requestStatus() {
    let jsondata = {'type': 'status'}
    websocket.send(JSON.stringify(jsondata));
    // updateStatusIndicators();
}

// request settings from the MCU 
function requestTimingConfig() {
    let jsondata = {'type': 'settings'}
    websocket.send(JSON.stringify(jsondata));
}

// toggle the automatic timer of the MCU
function toggleTimerEnable() {
    autoEnabled = !autoEnabled;
    let jsondata = {'type': 'auto',
        'auto_enabled': autoEnabled};
    if (debug) {console.log(jsondata);}
    websocket.send(JSON.stringify(jsondata));
}

// send updated settings to the MCU 
function updateSettings() {
    // get the various settings from the DOM
    let timeslots;
    let duration;
    let gmtOffset;
    let jsondata = {'type': 'chg_settings',
        'timeslots': timeslots,
        'duration': duration,
        'gmt_offset': gmtOffset}
    websocket.send(JSON.stringify(jsondata));
}

/* 
close the relay for a specified amount of time 
*/
function closeRelay() {
    setRelay(true);
    setTimeout(setRelay, 1000, false);
}

/*
manually set the relay for the set duration.
*/
function setRelay(state) {
    let jsondata = {'type': 'relay',
        'relay_status': state};
    console.log(jsondata);
    websocket.send(JSON.stringify(jsondata));
    
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

function loadTimeslotState(timeslot) {
    // let timeslot = parseInt($(clickedTimeslot).find('.tIndex').text());
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

// refresh all button states
function loadAllTimeslotStates() {
    for (let i=0;i<24;i++) {
        loadTimeslotState(i);
    }
}

function clickTimeslot(event) {
    let clickedTimeslot = $(event.currentTarget);
    let timeslot = parseInt($(clickedTimeslot).find('.tIndex').text());
    let curTimeslotVal = checkTimeslot(timeslot);
    setTimeslot(timeslot, !curTimeslotVal);
    loadTimeslotState(timeslot);
}

function checkTimeslot(timeslot) {
    let byteIndex = timeslot / 8;
    let bitIndex = timeslot % 8;
    let status = (timingConfig.timeslots[byteIndex] >> bitIndex) & 1;
    return status;
}

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

function setTimeslot(timeslot, state) {
    let byteIndex = timeslot / 8; 
    let bitIndex = timeslot % 8;
    let mask = 1 << bitIndex;
    if (state) {
        timingConfig.timeslots[byteIndex] = timingConfig.timeslots[byteIndex] | mask;
    }
    else {
        timingConfig.timeslots[byteIndex] = timingConfig.timeslots[byteIndex] & !mask;
    }
}

function setClosedDuration() {

}

function setGMTOffset() {

}

$(document).ready(function() {
    createTimeslotButtons();

    // initialize websocket 
    initWebSocket();

    // testing 
    // closeRelay();

    // set the callback functions here 
    
    // toggle timer enable 
    $("#masterSwitch").click(function() {
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
    $("#intervalDuration").on('input', function() {
        setI
        alert($("#intervalDuration").val());
    });
    // adjust the GMT offset 
    $("#GMTOffset").on('input', function() {
        alert($("#intervalDuration").val());
        setGMTOffset();
    });
    // save settings to the ESP
    $("#saveBtn").click(function() {

    });

    // load all initial timeslot states
    loadAllTimeslotStates();

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

