// import * as wsMod from "./websocketModule.mjs";
// import * as uicMod from "./uiControllerModule.mjs";
// import * as cfgMod from "./configModule.mjs";

import * as wsMod from "./wsMod.mjs";
import * as uicMod from "./uicMod.mjs";
import * as cfgMod from "./cfgMod.mjs";

export function changeUseNTP(event) {
    let useNTP = $(event.target).prop('checked');
    cfgMod.setUseNTP(useNTP);
    uicMod.refreshNTPDisplay(useNTP);
}

export function changeUserDateTime(event) {
    let userDTStr = $("#userDateTime").val();
    let userDT = new Date(userDTStr);
    cfgMod.setDateTime(userDT);
    // console.log(cfgMod.printTime(userDT));
}

// toggle the automatic timer of the MCU
export function clickAutoEnable(event) {
    // console.log("autoenabled");
    let autoEnabled = cfgMod.getAutoEnable();
    autoEnabled = !autoEnabled;
    cfgMod.setAutoEnable(autoEnabled);
    uicMod.refreshAutoEnableDisplay(autoEnabled);
    wsMod.setMCUAutoEnable(autoEnabled);
}

export async function clickCloseRelayBtn(event) {
    let duration = cfgMod.getDuration();
    await wsMod.setMCURelay(true, duration);
    uicMod.showPopupDisplay("Closed relay.");
}

export async function clickOpenRelayBtn(event) {
    await wsMod.setMCURelay(false);
    uicMod.showPopupDisplay("Opened relay.");
}

export function clicktimeBtn(event) {
    let clickedTimeslot = $(event.currentTarget);
    let timeslot = parseInt($(clickedTimeslot).find('.tIndex').text());
    let curTimeslotVal = cfgMod.getTimeslot(timeslot);
    cfgMod.setTimeslot(timeslot, !curTimeslotVal);
    refreshAllTimeslotsDisplay();
}

export function inputIntervalDuration(event) {
    uicMod.refreshDurationDisplayText();
}

export function changeIntervalDuration(event) {
    let duration = $(event.target).val();
    cfgMod.setDuration(duration);
}

export function changeMaxIntervalDuration(event) {
    let curDuration = cfgMod.getDuration();
    let maxDuration = $(event.target).val();
    uicMod.refreshMaxDurationDisplay(curDuration);
    if (curDuration > maxDuration) {
        cfgMod.setDuration(maxDuration);
    }
}   

export function changeGMTOffset(event) {
    let gmtOffset = $(event.target).val();
    cfgMod.setGMTOffset(gmtOffset);
}

export async function clickSaveBtn(event) {
    let curTimingConfig = cfgMod.getTimingConfig();
    let newDate = getInputDate();
    await wsMod.setMCUTimingConfig(curTimingConfig);
    await wsMod.setMCUDateTime(newDate);
    uicMod.showPopupDisplay(`Saved timing configuration.`);
}

export async function requestStatusInterval() {
    await wsMod.requestMCUStatus();
    uicMod.refreshRelayDisplay(cfgMod.getRelayStatus());
}

export async function requestDateInterval() {
    await wsMod.requestMCUTime();
    uicMod.refreshDateDisplay(cfgMod.getDateTime());
    // refreshTimeDisplay();
}

// refresh all timeslots and display on the webpage
export function refreshAllTimeslotsDisplay() {
    for (let i=0;i<24;i++) {
        let state = cfgMod.getTimeslot(i);
        uicMod.refreshTimeslotDisplay(i, state);
    }
}

// export function refreshTimeDisplay() {
//     let dtnow = ;
//     console.log('t');
//     uicMod.refreshDateDisplay(dtnow);
// }

export function getInputDate() {
    let userDTStr = $("#userDateTime").val();
    return new Date(userDTStr);
}







