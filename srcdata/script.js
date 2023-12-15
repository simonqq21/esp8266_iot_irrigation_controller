let gateway = `ws://${window.location.hostname}/ws`; 
let websocket;  



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
function requestStatus() {
    jsondata = {'type': 'status'}
    websocket.send(jsondata);
    // updateStatusIndicators();
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

$(document).ready(function() {

});