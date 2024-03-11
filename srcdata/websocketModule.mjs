// let gateway = `ws://${window.location.hostname}:5555/ws`; 
import * as uicMod from "./uiControllerModule.mjs";
import * as cfgMod from "./configModule.mjs";

export let gateway = `ws://192.168.5.75:5555/ws`; 
export let websocket;
export let debug = false; 

let setRelayTimeout; 

// #############################################################################
// Websocket initialization functions
// initialize websocket 
// {receiveTime, receiveStatus, receiveSettings}
export async function initWebSocket() {
    console.log('Websocket initializing');
    websocket = new WebSocket(gateway);
    websocket.onopen = onOpen; 
    websocket.onclose = onClose; 
    websocket.onmessage = onMessage;
}

// runs when websocket opens
async function onOpen(event) {
    // grab the settings from the MCU, then refresh the webpage elements.
    await requestMCUTime();
    await requestMCUAutoEnable();
    await requestMCUStatus();
    await requestMCUTimingConfig();
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
    // update time
    if (msgType == 'time') {
        cfgMod.saveTime(msg);
        // receiveTime(msg);     
    }
    // update status 
    else if (msgType == 'status') {
        cfgMod.saveStatus(msg);
        // console.log(`autoenabled=${JSON.stringify(msg)}`);
        // receiveStatus(msg);     
    }
    // update auto enable setting
    else if (msgType == 'auto_enable') {
        cfgMod.saveAutoEnable(msg);
    }
    // update settings
    else if (msgType == 'settings') {
        cfgMod.saveTimingConfig(msg);
        // receiveSettings(msg);   
    }
} 

// #############################################################################
// Getting values from the MCU via websockets 
// time, status, timingConfig
// get system time from the MCU
export async function requestMCUTime() {
    let jsondata = {'type': 'time'};
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("requestMCUTime - failed to connect to websockets");
    }
}

export async function requestMCUAutoEnable() {
    let jsondata = {'type': 'auto_enable'};
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("requestAutoEnable - failed to connect to websockets");
    }
}

// get status from the MCU
export async function requestMCUStatus() {
    let jsondata = {'type': 'status'};
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("requestMCUStatus - failed to connect to websockets");
        console.log(error);
    }
}

// get settings from the MCU 
export async function requestMCUTimingConfig() {
    let jsondata = {'type': 'settings'};
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("requestMCUTimingConfig - failed to connect to websockets");
    }
}

// manually set the system time the MCU
export async function setMCUSystemTime(systemDate) {
    // send value to MCU 
    let jsondata = {
        'type': 'chg_time',
        'year': systemDate.getFullYear(),
        'month': systemDate.getMonth(),
        'day': systemDate.getDate(),
        'hour': systemDate.getHours(),
        'minute': systemDate.getMinutes(),
        'second': systemDate.getSeconds()
    };
    if (debug) {console.log(jsondata);}
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("setMCUSystemTime - failed to connect to websockets");
    }
}

// toggle the automatic timer of the MCU
export async function setMCUAutoEnable(autoEnabled) {
    let jsondata = {'type': 'timer_auto',
        'auto_enabled': autoEnabled};   
    try {
        // console.log(`setMCUAutoEnable:${JSON.stringify(jsondata)})`);
        await websocket.send(JSON.stringify(jsondata));
    }
    catch (error) {
        console.log("setMCUAutoEnable - failed to connect to websockets");
    }
}

// send updated settings to the MCU 
export async function setMCUSettings(timingConfig) {
    // get the various settings from the DOM
    let jsondata = {'type': 'chg_settings',
        'timeslots': timingConfig.timeslots,
        'duration': timingConfig.duration,
        'gmt_offset': timingConfig.gmt_offset,
        'use_ntp': timingConfig.use_ntp};
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("setMCUSettings - failed to connect to websockets");
    }
}

/*
manually set the relay for the set duration.
*/
export async function setMCURelay(state, duration=1) {
    let jsondata = {'type': 'relay',
        'relay_status': state};
        if (debug) {console.log(jsondata);}
    try {
        await websocket.send(JSON.stringify(jsondata));
        if (state) {
            setRelayTimeout = setTimeout(setMCURelay, duration*1000, false);
        }
        else {
            clearTimeout(setRelayTimeout);
        }
    } catch (error) {
        console.log("setMCURelay - failed to connect to websockets");
    }
}

/*


// send updated settings to the MCU 
async function setMCUSettings(timingConfig) {
    // get the various settings from the DOM
    let jsondata = {'type': 'chg_settings',
        'timeslots': timingConfig.timeslots,
        'duration': timingConfig.duration,
        'gmt_offset': timingConfig.gmt_offset};
    try {
        await websocket.send(JSON.stringify(jsondata));
        showPopup("Settings saved successfully.");
    } catch (error) {
        console.log("setMCUSettings - failed to connect to websockets");
    }
}

async function setMCURelay(state) {
    let jsondata = {'type': 'relay',
        'relay_status': state};
    console.log(jsondata);
    try {
        await websocket.send(JSON.stringify(jsondata));
        showPopup(`Set relay to ${state}.`);
        if (state) {
            setRelayTimeout = setTimeout(setMCURelay, timingConfig.duration*1000, false);
        }
        else {
            clearTimeout(setRelayTimeout);
        }
    } catch (error) {
        console.log("setMCURelay - failed to connect to websockets");
    }
}
*/
