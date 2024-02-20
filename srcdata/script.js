/*
TODO:
web browser interaction
clicking on the activate pump button activates the pump momentarily
*/

/* JSON formats:
 - From browser to MCU 
   - browser request status update from MCU 
  {
    'type': 'status'
  }
   - browser request settings from MCU 
   {
    'type': 'settings'
   }
  - Toggle the automatic relay timer. Enabling the automatic relay timer will enable
  the daily relay hours, and disabling the automatic relay timer will simply 
  disable the daily relay hours so the only time the relay closes is if the user
  manually toggles the momentary relay button on the webpage or the physical button.
  This command is sent by the browser right away after the user toggles the automatic
  toggle.
  {
    'type': 'auto',
    'auto_enabled': bool
  }
  - sending updated settings from browser to MCU
  {
    'type': 'chg_settings',
    'hours': array of 3 bytes representing the three bytes stored in EEPROM,
    'duration': int from 0 to 60,
    'gmt_offset': int from -12 to 12,
  }
   - send command from browser to enable the relay momentarily for the saved duration.
  {
    'type': 'relay',
    'relay_status': bool 
  }

 - From MCU to browser 
  - sending relay status from MCU to browser
  {
    'type': 'status',
    'auto_enabled': bool,
    'relay_status': bool
  }
   - sending current settings from MCU to browser
  {
    'type': 'settings', 
    'hours': array of 3 bytes representing the three bytes stored in EEPROM,
    'duration': int from 0 to 60,
    'gmt_offset': int from -12 to 12,
  }
*/

let gateway = `ws://${window.location.hostname}/ws`; 
let websocket;  
let debug = true; 

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
    if (debug) {console.log(robotStatus['type']);};
    
    // update sensor readings 
    updateSensorReadings();
} 

// check if device has a touchscreen
function isTouchEnabled() {
    return ('ontouchstart' in window) || 
        (navigator.maxTouchPoints > 0) || 
        (navigator.msMaxTouchPoints > 0);
}

// request status from the MCU
function requestStatus() {
    jsondata = {'type': 'status'}
    websocket.send(JSON.stringify(jsondata));
    // updateStatusIndicators();
}

// request settings from the MCU 
function requestTimingConfig() {
    jsondata = {'type': 'settings'}
    websocket.send(JSON.stringify(jsondata));
}

// toggle the automatic timer of the MCU
function toggleTimerEnable() {
    autoEnabled = !autoEnabled;
    jsondata = {'type': 'auto',
        'auto_enabled': autoEnabled};
    websocket.send(JSON.stringify(jsondata));
}

// send updated settings to the MCU 
function updateSettings() {
    // get the various settings from the DOM
    let hours;
    let duration;
    let gmtOffset;
    jsondata = {'type': 'chg_settings',
        'hours': hours,
        'duration': duration,
        'gmt_offset': gmtOffset}
    websocket.send(JSON.stringify(jsondata));
}

/*
manually set the relay for the set duration.

*/
function setRelay(state) {
    jsondata = {'type': 'relay',
        'relay_status': state};
    websocket.send(JSON.stringify(jsondata));
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
    // initialize websocket 
    initWebSocket();
    // set the callback functions here 
    $("#masterSwitch").click(toggleTimerEnable);
    setInterval(requestStatus, 500);
    setInterval(requestTimingConfig, 500);
});

