import * as wsMod from "./websocketModule.mjs";
import * as uicMod from "./uiControllerModule.mjs";
import * as cfgMod from "./configModule.mjs";

export function changeUseNTP(event) {
    useNTP = $(event.target).prop('checked');
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
    let relayStatus = cfgMod.getRelayStatus();
    uicMod.showPopupDisplay(`Set relay to ${relayStatus}.`);
}

export async function clickOpenRelayBtn(event) {
    await wsMod.setMCURelay(false);
    let relayStatus = cfgMod.getRelayStatus();
    uicMod.showPopupDisplay(`Set relay to ${relayStatus}.`);
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
    let relayStatus = cfgMod.getRelayStatus();
    uicMod.refreshRelayDisplay(relayStatus);
}

export async function requestTimeInterval() {
    await wsMod.requestMCUTime();
}

// refresh all timeslots and display on the webpage
export function refreshAllTimeslotsDisplay() {
    for (let i=0;i<24;i++) {
        let state = cfgMod.getTimeslot(i);
        uicMod.refreshTimeslotDisplay(i, state);
    }
}

export function refreshTimeDisplayInterval() {
    let dtnow = cfgMod.getDateTime();
    let year = dtnow.getFullYear();
    let month = dtnow.getMonth() + 1;
    let date = dtnow.getDate();
    let hours = dtnow.getHours();
    let minutes = dtnow.getMinutes();
    let seconds = dtnow.getSeconds();
    uicMod.setTimeDisplay(year, month, date, hours, minutes, seconds);
}

export function getInputDate() {
    let userDTStr = $("#userDateTime").val();
    return new Date(userDTStr);
}







