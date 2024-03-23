// import * as cfgMod from "./configModule.mjs";
// import * as cbMod from "./callbackModule.mjs";

import * as cfgMod from "./cfgMod.mjs";
import * as cbMod from "./cbMod.mjs";

let maxDuration = 20;
let popupTimeout;

// refresh all values into display upon webpage load
export function refreshAllElements() {
    refreshAutoEnableDisplay(cfgMod.getAutoEnable());
    refreshRelayDisplay(cfgMod.getRelayStatus());
    cbMod.refreshAllTimeslotsDisplay();
    refreshDurationDisplay(cfgMod.getDuration());
    refreshGMTOffsetDisplay(cfgMod.getGMTOffset());
    setMaxDurationDisplay(maxDuration);
    refreshMaxDurationDisplay(cfgMod.getDuration());
    refreshNTPDisplay(cfgMod.getUseNTP());
}

// refresh the timer enable status on the webpage
export function refreshAutoEnableDisplay(autoEnabled) {
    if (autoEnabled) {
        $("#timerEnable").text('Enabled');
    }
    else {
        $("#timerEnable").text('Disabled');
    }
}

// refresh the relay status on the webpage
export function refreshRelayDisplay(relayStatus) {
    if (relayStatus) {
        $("#irrigationStatusIndicator").addClass("enabledBtn");
        $("#irrigationStatusIndicator").removeClass("disabledBtn");
    }
    else {
        $("#irrigationStatusIndicator").addClass("disabledBtn");
        $("#irrigationStatusIndicator").removeClass("enabledBtn");
    }
} 

// #############################################################################
// refresh timingconfig vars

// refresh relay status and display on the webpage
export function refreshNTPDisplay(useNTP) {
    $("#useNTP").prop('checked', useNTP);
    if (useNTP) {
        $("#userDateTimeDiv").hide();
    }
    else {
        let now = new Date();
        setDateFieldValue(now);
        $("#userDateTimeDiv").show();
    }
}

// refresh duration and display on the webpage
export function refreshDurationDisplay(duration) {
    $("#intervalDuration").val(duration);
    refreshDurationDisplayText();
}

// synchronize the value of the interval duration text with the interval duration
// input
export function refreshDurationDisplayText() {
    $("#intervalDurationDisplay").text($("#intervalDuration").val());
}

export function setMaxDurationDisplay(maxDuration) {
    $("#maxIntervalDuration").val(maxDuration);
}

export function refreshMaxDurationDisplay(curDuration) {
    let maxDurationVal = parseInt($("#maxIntervalDuration").val());

    if (curDuration > maxDurationVal) {
        refreshDurationDisplay(maxDurationVal);
    }
    $('#intervalDuration').attr('max', maxDurationVal);
}

// refresh GMT offset and display on the webpage
export function refreshGMTOffsetDisplay(gmt_offset) {
    $("#GMTOffset").val(gmt_offset);
}
// #############################################################################

// set the values of the date adjustment field 
export function setDateFieldValue(date) {
    let dateStr = date.getFullYear() + '-' +
        (date.getMonth()+1).toString().padStart(2, '0') + '-' +
        (date.getDate()).toString().padStart(2, '0') + 'T' + 
        (date.getHours()).toString().padStart(2, '0') + ':' +
        (date.getMinutes()).toString().padStart(2, '0') + ':' +
        (date.getSeconds()).toString().padStart(2, '0');
    $("#userDateTime").val(dateStr);
}

// update time in webpage 
export function refreshDateDisplay(dateVal) {
    let year = dateVal.getFullYear();
    let month = dateVal.getMonth() + 1;
    let date = dateVal.getDate();
    let hours = dateVal.getHours();
    let minutes = dateVal.getMinutes();
    let seconds = dateVal.getSeconds();
    let timeStr = `${year}/${month.toString().padStart(2, '0')}` +
    `/${date.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:` +
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    // console.log(timeStr);
    $("#time").text(timeStr);
}

// show popup with text 
export function showPopupDisplay(text) {
    clearTimeout(popupTimeout);
    $("#popup").show();
    $("#popupText").text(text);
    popupTimeout = setTimeout(hidePopupDisplay, 3000);
}

// hide popup
export function hidePopupDisplay() {
    $("#popup").hide();
}

// display the timeslot state for a particular timeslot
export function refreshTimeslotDisplay(timeslot, curTimeslotVal) {
    let clickedTimeslot = $(`#timeBtn${timeslot}`);
    let tState = $(clickedTimeslot).find('.tState');
    // let curTimeslotVal = getTimeslot(timeslot);
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
export function createTimeslotButtons() {
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

