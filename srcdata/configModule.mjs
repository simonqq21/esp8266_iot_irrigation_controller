
let setRelayTimeout; 

// status variables 
let relayStatus, autoEnabled, useNTP;
let timingConfig = {
    'timeslots': [2,0,0],
    'duration': 0,
    'gmt_offset': 8
}

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

export function setDuration(duration) {
    console.log('set duration');
    timingConfig.duration = duration; 
    refreshDurationDisplay();
}

export function setGMTOffset(offset) {
    timingConfig.gmt_offset = offset;
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
