function changeUseNTP(event) {
    
}

function changeUserDateTime(event) {
    // alert($("#userDateTime").val());
}

// toggle the automatic timer of the MCU
function clickTimerEnable(event) {
    autoEnabled = !autoEnabled;
}

function clickCloseRelayBtn(event) {

}

function clickOpenRelayBtn(event) {

}

function clicktimeBtn(event) {
    let clickedTimeslot = $(event.currentTarget);
    let timeslot = parseInt($(clickedTimeslot).find('.tIndex').text());
    let curTimeslotVal = getTimeslot(timeslot);
    setTimeslot(timeslot, !curTimeslotVal);
    console.log(curTimeslotVal);
    console.log(timingConfig.timeslots);
    loadAllTimeslotsDisplay(timeslot);
}

function inputIntervalDuration(event) {
    refreshDurationDisplay();
}

function changeIntervalDuration(event) {
    setDuration($("#intervalDuration").val());
}

function changeMaxIntervalDuration(event) {
    refreshMaxDurationDisplay();
}   

function changeGMTOffset(event) {
    setGMTOffset($("#GMTOffset").val());
}

function clickSaveBtn(event) {
    updateSettings();
    requestTimingConfig();
}














