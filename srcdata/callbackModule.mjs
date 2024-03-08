function clickTimeslot(event) {
    let clickedTimeslot = $(event.currentTarget);
    let timeslot = parseInt($(clickedTimeslot).find('.tIndex').text());
    let curTimeslotVal = getTimeslot(timeslot);
    setTimeslot(timeslot, !curTimeslotVal);
    console.log(curTimeslotVal);
    console.log(timingConfig.timeslots);
    loadAllTimeslotsDisplay(timeslot);
}



function refreshMaxDurationDisplay() {
    let maxDurationVal = parseInt($("#maxIntervalDuration").val());
    let curDuration = timingConfig.duration;

    $('#intervalDuration').attr('max', maxDurationVal);

    if (curDuration > maxDurationVal) {
        setDuration(maxDurationVal);
        loadDurationDisplay();
    }
}

// toggle the automatic timer of the MCU
async function toggleTimerEnable() {
    autoEnabled = !autoEnabled;
    let jsondata = {'type': 'timer_auto',
        'auto_enabled': autoEnabled};
    if (debug) {console.log(jsondata);}
    try {
        await websocket.send(JSON.stringify(jsondata));
        showPopup(`Set auto timer to ${autoEnabled}.`);
    } catch (error) {
        console.log("toggleTimerEnable - failed to connect to websockets");
    }
    finally {
        loadTimerEnableStatus();
    }
}