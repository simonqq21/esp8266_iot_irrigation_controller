/*
TODO:
web browser interaction
clicking on the activate pump button activates the pump momentarily
*/
let gateway = `ws://${window.location.hostname}/ws`; 
let websocket;  

// status variables 
let autoEnabled, relayStatus;
let timingConfig = {
    'hours': [0,0,0],
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
    robotStatus = JSON.parse(event.data);
    // update sensor readings 
    updateSensorReadings();
} 

// check if device has a touchscreen
function isTouchEnabled() {
    return ('ontouchstart' in window) || 
        (navigator.maxTouchPoints > 0) || 
        (navigator.msMaxTouchPoints > 0);
}
function requestStatus() {
    jsondata = {'type': 'status'}
    websocket.send(JSON.stringify(jsondata));
    // updateStatusIndicators();
}
// 
function toggleTimerEnable() {
    autoEnabled = !autoEnabled;
    jsondata = {'type': 'auto',
        'auto_enabled': autoEnabled};
    websocket.send(JSON.stringify(jsondata));
}

function closeRelay() {
    
}
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

$(document).ready(function() {
    // set the callback functions here 
    $("#masterSwitch").click(toggleTimerEnable);
});

