import * as wsMod from "./websocketModule.mjs";
import * as uicMod from "./uiControllerModule.mjs";
import * as cfgMod from "./configModule.mjs";

export function changeUseNTP(event) {
    useNTP = $(event.target).prop('checked');
    cfgMod.setUseNTP(useNTP);
    uicMod.refreshNTPDisplay(useNTP);
    // alert(useNTP);  
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
    let curTimeslotVal = getTimeslot(timeslot);
    setTimeslot(timeslot, !curTimeslotVal);
    console.log(curTimeslotVal);
    console.log(timingConfig.timeslots);
    loadAllTimeslotsDisplay(timeslot);
}

export function inputIntervalDuration(event) {
    uicMod.refreshDurationDisplayText();
}

export function changeIntervalDuration(event) {
    let duration = $(event.target).val();
    alert(`newduration=${duration}`);
    cfgMod.setDuration(duration);
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
    let relayStatus = cfgMod.getRelayStatus();
    uicMod.refreshRelayDisplay(relayStatus);
}

export async function requestTimeInterval() {
    await wsMod.requestMCUTime();
}











