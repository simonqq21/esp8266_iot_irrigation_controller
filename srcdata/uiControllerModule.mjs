
let maxDuration = 20;
let popupTimeout;

// load all values into display upon webpage load
function loadAllElements() {
    loadTimerEnableStatus();
    loadRelayStatus();
    loadAllTimeslotsDisplay();
    loadDurationDisplay();
    loadGMTOffset();
    refreshDurationDisplay();
    refreshMaxDurationDisplay();
}

// load relay status and display on the webpage
function loadUseNTPStatus(useNTP) {
    if (useNTP) {
        $("#useNTP").prop('checked', true);
        $("#userDateTimeDiv").hide();
    }
    else {
        $("#useNTP").prop('checked', false);
        $("#userDateTimeDiv").show();
    }
}

// load the timer enable status on the webpage
function loadTimerEnableStatus(autoEnabled) {
    if (autoEnabled) {
        $("#timerEnable").text('Enabled');
    }
    else {
        $("#timerEnable").text('Disabled');
    }
}

// load the relay status on the webpage
function loadRelayStatus() {
    if (relayStatus) {
        $("#irrigationStatusIndicator").addClass("enabledBtn");
        $("#irrigationStatusIndicator").removeClass("disabledBtn");
    }
    else {
        $("#irrigationStatusIndicator").addClass("disabledBtn");
        $("#irrigationStatusIndicator").removeClass("enabledBtn");
    }
} 

// load duration and display on the webpage
function loadDurationDisplay() {
    $("#intervalDuration").val(timingConfig.duration);
    refreshDurationDisplay();
}

// synchronize the value of the interval duration text with the interval duration
// input
function refreshDurationDisplay() {
    $("#intervalDurationDisplay").text($("#intervalDuration").val());
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

// load GMT offset and display on the webpage
function loadGMTOffset() {
    $("#GMTOffset").val(timingConfig.gmt_offset);
}

// update time in webpage 
function setTime(year, month, day, hour, minute, second) {
    let timeStr = `${year}/${month}/${day} ${hour}:${minute}:${second}`;
    console.log(timeStr);
    $("#time").text(timeStr);
}

// show popup with text 
function showPopup(text) {
    clearTimeout(popupTimeout);
    $("#popup").show();
    $("#popupText").text(text);
    popupTimeout = setTimeout(hidePopup, 3000);
}

// hide popup
function hidePopup() {
    $("#popup").hide();
}

// load all timeslots and display on the webpage
function loadAllTimeslotsDisplay() {
    for (let i=0;i<24;i++) {
        loadTimeslotState(i);
    }
}

// display the timeslot state for a particular timeslot
function loadTimeslotState(timeslot) {
    // let timeslot = parseInt($(clickedTimeslot).find('.tIndex').text());
    // console.log(timeslot);
    let clickedTimeslot = $(`#timeBtn${timeslot}`);
    let tState = $(clickedTimeslot).find('.tState');
    let curTimeslotVal = getTimeslot(timeslot);
    if (curTimeslotVal) {
        $(clickedTimeslot).addClass('enabledBtn');
        $(clickedTimeslot).removeClass('disabledBtn');
        $(tState).text("On");
    }
    else {
        $(clickedTimeslot).addClass('disabledBtn');
        $(clickedTimeslot).removeClass('enabledBtn');
        $(tState).text("Off");
    }
}

// create the buttons for each timeslot in a day
function createTimeslotButtons() {
    for (let i=0;i<24;i++) {
        let newTimeslotBtn = $('<button>', {id: `timeBtn${i}`, class: "timeBtn"});
        let newTIndex = $('<span>', {class: "tIndex"});
        let newTState = $('<span>', {class: "tState"});
        $(newTIndex).text(i);
        $(newTState).text('Off');
        $(newTimeslotBtn).append(newTIndex);
        $(newTimeslotBtn).append(newTState);
        $('.irrigationScheduleRow').append(newTimeslotBtn);
    }
}

