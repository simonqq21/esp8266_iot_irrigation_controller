#include <Arduino.h>
#include "wsModule.h" 
#include "constants.h"
#include "ioModule.h"
#include "timeModule.h"
#include "wifiModule.h"

extern DateTime dtnow; 

// async web server
AsyncWebServer server(5555); 
AsyncWebSocket ws("/ws"); 
StaticJsonDocument<150> inputDoc;
StaticJsonDocument<150> outputDoc;
char strData[150];

extern bool autoEnabled;
extern bool relayState;
extern timingconfig tC;

extern AsyncWebHandler wifiGetHandler, wifiPostHandler; 

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
    if (commandType == "time") {
      sendSystemDateTime();
    }
    else if (commandType == "chg_time") {
      adjustRTCFromJSON();
    }
    // else if (command)
    else if (commandType == "status") {
      sendStatus();
    }
    // get auto enable setting 
    else if (commandType == "auto_enable") {
      getAutoEnable();
      sendAutoEnable();
    }
    // toggle the automatic relay timer 
    else if (commandType == "chg_auto_enable") {
      setAutoEnable();
      if (DEBUG) {
        Serial.print("set auto to ");
        Serial.println(autoEnabled);
      }
    }
    // send persistent settings JSON
    else if (commandType == "settings") {
      // if (DEBUG) {
      //   Serial.println("sending settings");
      // }
      getConfig();  
      sendTimingConfig();
    }
    // save persistent settings to EEPROM 
    else if (commandType == "chg_settings") {
      setTimingConfig();
      // update NTP with new GMT offset
      updateNTPTime(); 
      if (DEBUG) {
        Serial.println("set default settings to");
        printConfig();
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

void initServer() {
  // route for root web page 
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/index.html", String(), false);});
  server.on("/styles.css", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/styles.css", "text/css", false);});

  server.on("/jquery.js", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/jquery.js", "text/javascript", false);});

  server.on("/s.js", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/s.js", "text/javascript", false);});
  server.on("/wsMod.mjs", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/wsMod.mjs", "text/javascript", false);});
  server.on("/cfgMod.mjs", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/cfgMod.mjs", "text/javascript", false);});
  server.on("/uicMod.mjs", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/uicMod.mjs", "text/javascript", false);});
  server.on("/cbMod.mjs", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/cbMod.mjs", "text/javascript", false);});
  wifiGetHandler = server.on("/wifi", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/wifi.html", String(), false);});
  wifiPostHandler = server.on("/wifi", HTTP_POST, [](AsyncWebServerRequest *request) {
    saveWiFi(request);
  });
  // initialize websocket 
  initWebSocket(); 
  server.begin();
}

// initialize the websocket 
void initWebSocket() {
  Serial.println("initialized ws");
  ws.onEvent(onEvent);
  server.addHandler(&ws);
}

void sendSystemDateTime() {
//   checkTime();
  if (DEBUG) {
    printRTCTime(dtnow);
  }
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
  Serial.println("status");
  outputDoc.clear();
  outputDoc["type"] = "status";
  outputDoc["relay_status"] = relayState;
  serializeJson(outputDoc, strData);
  ws.textAll(strData);
}

// send auto enable setting to browser 
void sendAutoEnable() {
  outputDoc.clear();
  outputDoc["type"] = "auto_enable";
  outputDoc["auto_enabled"] = autoEnabled;
  serializeJson(outputDoc, strData);
  ws.textAll(strData);
}

// send persistent settings to browser
void sendTimingConfig() {
  outputDoc.clear(); 
  outputDoc["type"] = "settings";
  outputDoc["use_ntp"] = tC.useNTP;
  JsonArray timeslots = outputDoc.createNestedArray("timeslots");
  for (int i=0;i<3;i++) {
    timeslots.add(tC.timeslots[i]);
  }
  outputDoc["duration"] = tC.duration;
  outputDoc["gmt_offset"] = tC.gmtOffset;
  serializeJson(outputDoc, strData);
  ws.textAll(strData);
}