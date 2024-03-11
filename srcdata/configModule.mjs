// status variables 
let relayStatus, autoEnabled;
let timingConfig = {
    'timeslots': [2,0,0],
    'duration': 0,
    'gmt_offset': 8,
    'use_ntp': false
}
let systemDate = new Date();

// save time from JSON message
export function saveTime(jsonMsg) {
    systemDate.setFullYear(jsonMsg.year);
    systemDate.setMonth(jsonMsg.month);
    systemDate.setDate(jsonMsg.day);
    systemDate.setHours(jsonMsg.hour);
    systemDate.setMinutes(jsonMsg.min);
    systemDate.setSeconds(jsonMsg.sec);
}

// save status variables from JSON message
export function saveStatus(jsonMsg) {
    relayStatus = jsonMsg["relay_status"];
    autoEnabled = jsonMsg["auto_enabled"];
}

// save timing config from JSON message
export function saveTimingConfig(jsonMsg) {
    setTimeslots(jsonMsg["timeslots"]);
    setDuration(jsonMsg["duration"]);
    setGMTOffset(jsonMsg["gmt_offset"]);
    setUseNTP(jsonMsg["use_ntp"]);
}

// get time from config
export function getTime() {
    return systemDate;
}

// get auto timer enabled from config
export function getAutoEnabled() {
    return autoEnabled;
}

// get relay status from config
export function getRelayStatus() {
    return relayStatus;
}

// get timingConfig from config
export function getTimingConfig() {
    return timingConfig;
}

export function getDuration() {
    return timingConfig.duration;
}

export function getGMTOffset() {
    return timingConfig.gmt_offset;
}

export function getUseNTP() {
    return timingConfig.use_ntp;
}

// get the state of a particular timeslot
export function getTimeslot(timeslot) {
    let byteIndex = parseInt(timeslot / 8);
    let bitIndex = parseInt(timeslot % 8);
    let status = (timingConfig.timeslots[byteIndex] >> bitIndex) & 1;
    return status;
}

export function setRelayStatus(status) {
    relayStatus = status;
}

export function setAutoEnabled(newAutoEnabled) {
    autoEnabled = newAutoEnabled;
}

// set the duration of the close relay
export function setDuration(duration) {
    timingConfig.duration = duration; 
}

// set the GMT offset
export function setGMTOffset(offset) {
    timingConfig.gmt_offset = offset;
}

// set the use NTP variable
export function setUseNTP(useNTP) {
    timingConfig.use_ntp = useNTP;
}

export function setTimeslots(timeslots) {
    timingConfig.timeslots = timeslots;
}

// set the state of a particular timeslot
export function setTimeslot(timeslot, state) {
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





/*
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

// get various status variables from JSON message
function receiveStatus(jsonMsg) {
    relayStatus = jsonMsg["relay_status"];
    useNTP = jsonMsg["use_ntp"];
    autoEnabled = jsonMsg["auto_enabled"];
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
*/
