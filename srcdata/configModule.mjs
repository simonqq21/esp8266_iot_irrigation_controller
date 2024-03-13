// status variables 
let relayStatus, autoEnabled;
let timingConfig = {
    'timeslots': [2,0,0],
    'duration': 0,
    'gmt_offset': 8,
    'use_ntp': false
}
let systemDate = new Date();

export function printTime(dt) {
    return `${dt.getFullYear()}/${dt.getMonth()+1}/${dt.getDate()} ` +
    `${dt.getHours()}:${dt.getMinutes()}:${dt.getSeconds()}`;
}

// save time from JSON message
export function saveDateTime(jsonMsg) {
    systemDate.setFullYear(jsonMsg.year);
    systemDate.setMonth(jsonMsg.month - 1);
    systemDate.setDate(jsonMsg.day);
    systemDate.setHours(jsonMsg.hour);
    systemDate.setMinutes(jsonMsg.min);
    systemDate.setSeconds(jsonMsg.sec);
    // console.log(printTime(systemDate));
}

// save status variables from JSON message
export function saveStatus(jsonMsg) {
    setRelayStatus(jsonMsg.relay_status);
}

export function saveAutoEnable(jsonMsg) {
    // alert(jsonMsg.auto_enabled);
    setAutoEnable(jsonMsg.auto_enabled);
}

// save timing config from JSON message
export function saveTimingConfig(jsonMsg) {
    setTimeslots(jsonMsg.timeslots);
    setDuration(jsonMsg.duration);
    setGMTOffset(jsonMsg.gmt_offset);
    setUseNTP(jsonMsg.use_ntp);
}

// get time from config
export function getDateTime() {
    return systemDate;
}

// get auto timer enabled from config
export function getAutoEnable() {
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

export function setDateTime(newDT) {
    systemDate = newDT;
}

export function setRelayStatus(status) {
    relayStatus = status;
}

export function setAutoEnable(newAutoEnabled) {
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