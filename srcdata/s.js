let gateway=`ws://192.168.5.75:5555/ws`;let websocket;let debug=true;let autoEnabled,relayStatus;let timingConfig={timeslots:[2,0,0],duration:0,gmt_offset:8};let maxDuration=100;let popupTimeout;let setRelayTimeout;function initWebSocket(){console.log("Websocket initializing");websocket=new WebSocket(gateway);websocket.onopen=onOpen;websocket.onclose=onClose;websocket.onmessage=onMessage}function onOpen(t){requestStatus();requestTimingConfig()}function onClose(t){setTimeout(initWebSocket,2e3)}function onMessage(t){msg=JSON.parse(t.data);let e=msg["type"];if(debug){console.log(msg)}if(e=="status"){receiveStatus(msg)}else if(e=="settings"){receiveSettings(msg)}}async function requestStatus(){let t={type:"status"};try{await websocket.send(JSON.stringify(t))}catch(t){console.log("requestStatus - failed to connect to websockets")}}async function requestTimingConfig(){let t={type:"settings"};try{await websocket.send(JSON.stringify(t))}catch(t){console.log("requestTimingConfig - failed to connect to websockets")}}async function toggleTimerEnable(){autoEnabled=!autoEnabled;let t={type:"auto",auto_enabled:autoEnabled};if(debug){console.log(t)}try{await websocket.send(JSON.stringify(t));showPopup(`Set auto timer to ${autoEnabled}.`)}catch(t){console.log("toggleTimerEnable - failed to connect to websockets")}finally{loadTimerEnableStatus()}}async function updateSettings(){let t={type:"chg_settings",timeslots:timingConfig.timeslots,duration:timingConfig.duration,gmt_offset:timingConfig.gmt_offset};try{await websocket.send(JSON.stringify(t));showPopup("Settings saved successfully.")}catch(t){console.log("updateSettings - failed to connect to websockets")}}async function setRelay(t){let e={type:"relay",relay_status:t};console.log(e);try{await websocket.send(JSON.stringify(e));showPopup(`Set relay to ${t}.`);if(t){setRelayTimeout=setTimeout(setRelay,timingConfig.duration*1e3,false)}else{clearTimeout(setRelayTimeout)}}catch(t){console.log("setRelay - failed to connect to websockets")}}function isTouchEnabled(){return"ontouchstart"in window||navigator.maxTouchPoints>0||navigator.msMaxTouchPoints>0}function receiveStatus(t){autoEnabled=t["auto_enabled"];relayStatus=t["relay_status"];loadRelayStatus();loadTimerEnableStatus()}function receiveSettings(t){console.log(`jsonMsg tC = ${JSON.stringify(t)}`);timingConfig.timeslots=t["timeslots"];timingConfig.duration=t["duration"];timingConfig.gmt_offset=t["gmt_offset"];loadAllTimeslotsDisplay();loadDurationDisplay();loadGMTOffset()}function createTimeslotButtons(){for(let i=0;i<24;i++){let t=$("<button>",{id:`timeBtn${i}`,class:"timeBtn"});let e=$("<span>",{class:"tIndex"});let n=$("<span>",{class:"tState"});$(e).text(i);$(n).text("Off");$(t).append(e);$(t).append(n);$(".irrigationScheduleRow").append(t)}}function showPopup(t){clearTimeout(popupTimeout);$("#popup").show();$("#popupText").text(t);popupTimeout=setTimeout(hidePopup,3e3)}function hidePopup(){$("#popup").hide()}function loadAllTimeslotsDisplay(){for(let t=0;t<24;t++){loadTimeslotState(t)}}function loadTimeslotState(t){let e=$(`#timeBtn${t}`);let n=$(e).find(".tState");let i=checkTimeslot(t);if(i){$(e).addClass("enabledBtn");$(e).removeClass("disabledBtn");$(n).text("On")}else{$(e).addClass("disabledBtn");$(e).removeClass("enabledBtn");$(n).text("Off")}}function clickTimeslot(t){let e=$(t.currentTarget);let n=parseInt($(e).find(".tIndex").text());let i=checkTimeslot(n);setTimeslot(n,!i);console.log(i);console.log(timingConfig.timeslots);loadAllTimeslotsDisplay(n)}function checkTimeslot(t){let e=parseInt(t/8);let n=parseInt(t%8);let i=timingConfig.timeslots[e]>>n&1;return i}function setTimeslot(t,e){let n=parseInt(t/8);let i=parseInt(t%8);let o=1<<i;console.log(`mask=${o}`);if(e){timingConfig.timeslots[n]=timingConfig.timeslots[n]|o}else{timingConfig.timeslots[n]=timingConfig.timeslots[n]&~o}}function setDuration(t){console.log("set duration");timingConfig.duration=t;refreshDurationDisplay()}function setGMTOffset(t){timingConfig.gmt_offset=t}function loadAllElements(){loadTimerEnableStatus();loadRelayStatus();loadAllTimeslotsDisplay();loadDurationDisplay();loadGMTOffset();refreshDurationDisplay();refreshMaxDurationDisplay()}function loadTimerEnableStatus(){if(autoEnabled){$("#timerEnable").text("Enabled")}else{$("#timerEnable").text("Disabled")}}function loadRelayStatus(){if(relayStatus){$("#irrigationStatusIndicator").addClass("enabledBtn");$("#irrigationStatusIndicator").removeClass("disabledBtn")}else{$("#irrigationStatusIndicator").addClass("disabledBtn");$("#irrigationStatusIndicator").removeClass("enabledBtn")}}function loadDurationDisplay(){$("#intervalDuration").val(timingConfig.duration);refreshDurationDisplay()}function loadGMTOffset(){$("#GMTOffset").val(timingConfig.gmt_offset)}function refreshDurationDisplay(){$("#intervalDurationDisplay").text($("#intervalDuration").val())}function refreshMaxDurationDisplay(){let t=parseInt($("#maxIntervalDuration").val());let e=timingConfig.duration;$("#intervalDuration").attr("max",t);if(e>t){setDuration(t);loadDurationDisplay()}}$(document).ready(async function(){createTimeslotButtons();initWebSocket();$("#maxIntervalDuration").val(maxDuration);refreshMaxDurationDisplay();$("#timerEnable").click(function(){toggleTimerEnable()});$("#closeRelayBtn").click(function(){setRelay(true)});$("#openRelayBtn").click(function(){setRelay(false)});$(".timeBtn").click(function(t){clickTimeslot(t)});$("#intervalDuration").on("change",function(){setDuration($("#intervalDuration").val())});$("#intervalDuration").on("input",function(){refreshDurationDisplay()});$("#maxIntervalDuration").on("change",function(){refreshMaxDurationDisplay()});$("#GMTOffset").on("change",function(){setGMTOffset($("#GMTOffset").val())});$("#saveBtn").click(function(){updateSettings();requestTimingConfig()});setInterval(requestStatus,500)});