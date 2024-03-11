import * as wsMod from "./websocketModule.mjs";
import * as uicMod from "./uiControllerModule.mjs";
import * as cfgMod from "./configModule.mjs";

export function changeUseNTP(event) {
    // alert("changeNTP");     
    let clicked = $(event.target);
    useNTP = $(clicked).prop('checked');
    cfgMod.setUseNTP(useNTP);
    uicMod.refreshNTPDisplay(useNTP);
}

export function changeUserDateTime(event) {
    alert($("#userDateTime").val());
}

// toggle the automatic timer of the MCU
export function clickAutoEnable(event) {
    // console.log("autoenabled");
    let autoEnabled = cfgMod.getAutoEnabled();
    autoEnabled = !autoEnabled;
    cfgMod.setAutoEnabled(autoEnabled);
    uicMod.refreshAutoEnableDisplay(autoEnabled);
    wsMod.setMCUAutoEnable(autoEnabled);
}

export function clickCloseRelayBtn(event) {

}

export function clickOpenRelayBtn(event) {

}

export function clicktimeBtn(event) {
    let clickedTimeslot = $(event.currentTarget);
    let timeslot = parseInt($(clickedTimeslot).find('.tIndex').text());
    let curTimeslotVal = getTimeslot(timeslot);
    setTimeslot(timeslot, !curTimeslotVal);
    console.log(curTimeslotVal);
    console.log(timingConfig.timeslots);
    loadAllTimeslotsDisplay(timeslot);
}

export function inputIntervalDuration(event) {
    refreshDurationDisplay();
}

export function changeIntervalDuration(event) {
    setDuration($("#intervalDuration").val());
}

export function changeMaxIntervalDuration(event) {
    refreshMaxDurationDisplay();
}   

export function changeGMTOffset(event) {
    setGMTOffset($("#GMTOffset").val());
}

export function clickSaveBtn(event) {
    updateSettings();
    requestTimingConfig();
}

export async function requestStatusInterval() {
    await wsMod.requestMCUStatus();
    let autoEnabled = cfgMod.getAutoEnabled();
    // console.log(`autoEnabled1=${autoEnabled}`); 
    uicMod.refreshAutoEnableDisplay(autoEnabled);
}

export async function requestTimeInterval() {
    await wsMod.requestMCUTime();
}











