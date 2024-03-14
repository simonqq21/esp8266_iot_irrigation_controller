import*as wsMod from"./wsMod.mjs";import*as uicMod from"./uicMod.mjs";import*as cfgMod from"./cfgMod.mjs";export function changeUseNTP(e){useNTP=$(e.target).prop("checked");cfgMod.setUseNTP(useNTP);uicMod.refreshNTPDisplay(useNTP)}export function changeUserDateTime(e){let t=$("#userDateTime").val();let o=new Date(t);cfgMod.setDateTime(o)}export function clickAutoEnable(e){let t=cfgMod.getAutoEnable();t=!t;cfgMod.setAutoEnable(t);uicMod.refreshAutoEnableDisplay(t);wsMod.setMCUAutoEnable(t)}export async function clickCloseRelayBtn(e){let t=cfgMod.getDuration();await wsMod.setMCURelay(true,t);uicMod.showPopupDisplay("Closed relay.")}export async function clickOpenRelayBtn(e){await wsMod.setMCURelay(false);uicMod.showPopupDisplay("Opened relay.")}export function clicktimeBtn(e){let t=$(e.currentTarget);let o=parseInt($(t).find(".tIndex").text());let a=cfgMod.getTimeslot(o);cfgMod.setTimeslot(o,!a);refreshAllTimeslotsDisplay()}export function inputIntervalDuration(e){uicMod.refreshDurationDisplayText()}export function changeIntervalDuration(e){let t=$(e.target).val();cfgMod.setDuration(t)}export function changeMaxIntervalDuration(e){let t=cfgMod.getDuration();let o=$(e.target).val();uicMod.refreshMaxDurationDisplay(t);if(t>o){cfgMod.setDuration(o)}}export function changeGMTOffset(e){let t=$(e.target).val();cfgMod.setGMTOffset(t)}export async function clickSaveBtn(e){let t=cfgMod.getTimingConfig();let o=getInputDate();await wsMod.setMCUTimingConfig(t);await wsMod.setMCUDateTime(o);uicMod.showPopupDisplay(`Saved timing configuration.`)}export async function requestStatusInterval(){await wsMod.requestMCUStatus();uicMod.refreshRelayDisplay(cfgMod.getRelayStatus())}export async function requestDateInterval(){await wsMod.requestMCUTime();uicMod.refreshDateDisplay(cfgMod.getDateTime())}export function refreshAllTimeslotsDisplay(){for(let t=0;t<24;t++){let e=cfgMod.getTimeslot(t);uicMod.refreshTimeslotDisplay(t,e)}}export function getInputDate(){let e=$("#userDateTime").val();return new Date(e)}