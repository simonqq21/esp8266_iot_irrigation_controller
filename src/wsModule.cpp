#include <Arduino.h>
#include "wsModule.h" 
#include "constants.h"
#include "ioModule.h"
#include "timeModule.h"

extern DateTime dtnow; 

// async web server
AsyncWebServer server(5555); 
AsyncWebSocket ws("/ws"); 
StaticJsonDocument<150> inputDoc;
StaticJsonDocument<150> outputDoc;
char strData[150];

extern bool autoEnabled, useNTP;
extern bool relayState;

extern timingconfig tC;

// run everytime new data is received from the websocket
void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type,
             void *arg, uint8_t *data, size_t len) {
    switch (type) {
      case WS_EVT_CONNECT:
        Serial.printf("WebSocket client #%u connected from %s\n", client->id(), client->remoteIP().toString().c_str());
        break;
      case WS_EVT_DISCONNECT:
        Serial.printf("WebSocket client #%u disconnected\n", client->id());
        break;
      case WS_EVT_DATA:
        handleWebSocketMessage(arg, data, len);
        break;
      case WS_EVT_PONG:
      case WS_EVT_ERROR:
        break;
  }
}

// function that receives all JSON data from the controlling device
void handleWebSocketMessage(void *arg, uint8_t *data, size_t len) {
  AwsFrameInfo *info = (AwsFrameInfo*)arg;
  if (info->final && info->index == 0 && info->len == len && info->opcode == WS_TEXT) {
    data[len] = 0;
    
    //    deserialize the JSON into a JSON object
    DeserializationError error = deserializeJson(inputDoc, (char*)data); 

    // Serial.println((char*) data);
    if (error) {
      Serial.print("deserializeJson failed: ");
      Serial.println(error.f_str());
    }
    // else 
    //   Serial.println("deserializeJson success");
      
    String commandType = inputDoc["type"];
    // Serial.print("commandType=");
    // Serial.println(commandType);
    // send status JSON
    if (commandType == "status") {
      // if (DEBUG) {
      //   Serial.println("sending status");
      // }
      getAutoEnable();
      getUseNTP();
      sendStatus();
    }
    else if (commandType == "time") {
      sendSystemDateTime();
    }
    // toggle the automatic relay timer 
    else if (commandType == "timer_auto") {
      setAutoEnable();
      if (DEBUG) {
        Serial.print("set auto to ");
        Serial.println(autoEnabled);
      }
    }
    // toggle between NTP and manual time setting 
    else if (commandType == "ntp") {
      setUseNTP();
      if (DEBUG) {
        Serial.print("set use_NTP to ");
        Serial.println(useNTP);
      }
    }
    // send persistent settings JSON
    else if (commandType == "settings") {
      // if (DEBUG) {
      //   Serial.println("sending settings");
      // }
      getTimingConfig();  
      sendTimingConfig();
    }
    // save persistent settings to EEPROM 
    else if (commandType == "chg_settings") {
      setTimingConfig();
      if (DEBUG) {
        Serial.println("set default settings to");
        printTimingConfig();
      }
    }
    // close the relay momentarily from user manual input 
    else if (commandType == "relay") {
      if (DEBUG) {
        Serial.print("setting relay to ");
        Serial.println(relayState);
      }
      setRelay(inputDoc["relay_status"]);
    }
    inputDoc.clear();
  }
}

// initialize the websocket 
void initWebSocket() {
  ws.onEvent(onEvent);
  server.addHandler(&ws);
}

void sendSystemDateTime() {
//   checkTime();
  printRTCTime(dtnow);
  outputDoc.clear();
  outputDoc["type"] = "time";
  outputDoc["year"] = dtnow.year();
  outputDoc["month"] = dtnow.month();
  outputDoc["day"] = dtnow.day();
  outputDoc["hour"] = dtnow.hour();
  outputDoc["min"] = dtnow.minute();
  outputDoc["sec"] = dtnow.second();
  serializeJson(outputDoc, strData);
  ws.textAll(strData);
}

// send status update to browser 
void sendStatus() {
  outputDoc.clear();
  outputDoc["type"] = "status";
  outputDoc["auto_enabled"] = autoEnabled;
  outputDoc["relay_status"] = relayState;
  outputDoc["use_ntp"] = useNTP;
  serializeJson(outputDoc, strData);
  ws.textAll(strData);
}

// send persistent settings to browser
void sendTimingConfig() {
  outputDoc.clear(); 
  outputDoc["type"] = "settings";
  JsonArray timeslots = outputDoc.createNestedArray("timeslots");
  for (int i=0;i<3;i++) {
    timeslots.add(tC.timeslots[i]);
  }
  outputDoc["duration"] = tC.duration;
  outputDoc["gmt_offset"] = tC.gmtOffset;
  serializeJson(outputDoc, strData);
  ws.textAll(strData);
}