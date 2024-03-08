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
    getMCUStatus();
    getMCUTimingConfig();
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
// Getting values from the MCU via websockets 
// time, status, timingConfig
// get system time from the MCU
export async function getMCUTime() {
    let jsondata = {'type': 'time'}
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("getMCUTime - failed to connect to websockets");
    }
}

// get status from the MCU
export async function getMCUStatus() {
    let jsondata = {'type': 'status'}
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("getMCUStatus - failed to connect to websockets");
    }
}

// get settings from the MCU 
export async function getMCUTimingConfig() {
    let jsondata = {'type': 'settings'}
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("getMCUTimingConfig - failed to connect to websockets");
    }
}

// #############################################################################
// Setting values from the MCU via websockets 
// set the use NTP value to the MCU
export async function setMCUUseNTP(useNTP) {
    // send value to MCU 
    let jsondata = {
        'type': 'ntp',
        'use_ntp': useNTP
    };
    if (debug) {console.log(jsondata);}
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("setMCUUseNTP - failed to connect to websockets");
    }
}

// // manually set the system time the MCU
// export async function setMCUSystemTime() {
//     // send value to MCU 
//     let jsondata = {
//         'type': 'chg_time',
//         'year': useNTP,
//         'month': ,
//         'day': ,
//         'hour': ,
//         'minute': ,
//         'second': 
//     };
//     if (debug) {console.log(jsondata);}
//     try {
//         await websocket.send(JSON.stringify(jsondata));
//     } catch (error) {
//         console.log("setMCUSystemTime - failed to connect to websockets");
//     }
// }

// toggle the automatic timer of the MCU
async function setMCUTimerEnable(autoEnabled) {
    let jsondata = {'type': 'timer_auto',
        'auto_enabled': autoEnabled};
    if (debug) {console.log(jsondata);}
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("setMCUTimerEnable - failed to connect to websockets");
    }
}

// send updated settings to the MCU 
async function setMCUSettings(timingConfig) {
    // get the various settings from the DOM
    let jsondata = {'type': 'chg_settings',
        'timeslots': timingConfig.timeslots,
        'duration': timingConfig.duration,
        'gmt_offset': timingConfig.gmt_offset};
    try {
        await websocket.send(JSON.stringify(jsondata));
    } catch (error) {
        console.log("setMCUSettings - failed to connect to websockets");
    }
}

/*
manually set the relay for the set duration.
*/
async function setMCURelay(state) {
    let jsondata = {'type': 'relay',
        'relay_status': state};
    console.log(jsondata);
    try {
        await websocket.send(JSON.stringify(jsondata));
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

/*
export async function setUseNTP(event) {
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
