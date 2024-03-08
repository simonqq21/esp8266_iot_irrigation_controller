// let gateway = `ws://${window.location.hostname}:5555/ws`; 
export let gateway = `ws://192.168.5.75:5555/ws`; 
export let websocket;
export let debug = true; 

// #############################################################################
// Websocket initialization functions
// initialize websocket 
export function initWebSocket() {
    console.log('Websocket initializing');
    websocket = new WebSocket(gateway);
    websocket.onopen = onOpen; 
    websocket.onclose = onClose; 
    websocket.onmessage = onMessage;
}

// runs when websocket opens
function onOpen(event) {
    // grab the settings from the MCU, then refresh the webpage elements.
    requestStatus();
    requestTimingConfig();
}
// runs when websocket closes
function onClose(event) {
    // alert('Connection closed');
    setTimeout(initWebSocket, 2000); // restart websocket
}
// runs when websocket receives message from server
function onMessage(event) {
    // console.log(event.data);
    let msg = JSON.parse(event.data);
    let msgType = msg['type'];
    if (debug) {console.log(msg);}
    // update status 
    if (msgType == 'time') {
        receiveTime(msg);     
    }
    else if (msgType == 'status') {
        receiveStatus(msg);     
    }
    // update settings
    else if (msgType == 'settings') {
        receiveSettings(msg);   
    }
} 

// #############################################################################
// Websocket initialization functions
// request system time from the MCU
export async function requestTime() {
    let jsondata = {'type': 'time'}
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("requestTime - failed to connect to websockets");
    }
}

// request status from the MCU
export async function requestStatus() {
    let jsondata = {'type': 'status'}
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("requestStatus - failed to connect to websockets");
    }
}

// request settings from the MCU 
export async function requestTimingConfig() {
    let jsondata = {'type': 'settings'}
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("requestTimingConfig - failed to connect to websockets");
    }
}