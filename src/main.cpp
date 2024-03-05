#include <Arduino.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h> 
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h> 
#include <EEPROM.h>
#include <RTClib.h>
#include <SPI.h> 
#include <NTPClient.h> 
#include <WiFiUdp.h>
#include <TimeLib.h>
#include "settingsModule.h"
#include "timeModule.h"
#include "ioModule.h"
#include "constants.h"

/*
settingsModule - getting and setting persistent settings to and from EEPROM
timeModule - getting and setting time between RTC and NTP 
ioModule - handle physical IO between button, relay, and LED
main - handle websocket client
*/

// transient settings
bool* timeslots;
extern bool relayState;

// EEPROM 
extern unsigned int configAddr, autoEnableAddr;
extern timingconfig tC;
extern bool autoEnabled;

// RTC 
extern RTC_DS1307 rtc; 
extern DateTime dtnow; 

// // NTP server 
extern long UTCOffsetInSeconds;
extern NTPClient timeClient; 


// // string array of days of the week
// String daysOfTheWeek[7] = {
//   "Monday", 
//   "Tuesday", 
//   "Wednesday",
//   "Thursday",
//   "Friday",
//   "Saturday", 
//   "Sunday"
// };

// async web server
AsyncWebServer server(5555); 
AsyncWebSocket ws("/ws"); 
StaticJsonDocument<150> inputDoc;
StaticJsonDocument<150> outputDoc;
char strData[150];

// wifi credentials
#define LOCAL_SSID "wifi"
#define LOCAL_PASS "password"
#define LOCAL_SSID "QUE-STARLINK"
#define LOCAL_PASS "Quefamily01259"

//static IP address configuration 
IPAddress local_IP(192,168,5,75);
IPAddress gateway(192,168,5,1);
IPAddress subnet(255,255,255,0);
IPAddress primaryDNS(8,8,8,8);
IPAddress secondaryDNS(8,8,4,4);

//for littlefs
File indexPage;  

void printWiFi(); 
void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType 
  type, void *arg, uint8_t *data, size_t len);
void handleWebSocketMessage(void *arg, uint8_t *data, size_t len);
void initWebSocket();
void sendStatus();
void sendTimingConfig();
void checkTime();
void sendSystemDateTime(); 

void setup() {
  Serial.begin(115200); 
  
  // littleFS 
  if (!LittleFS.begin()) {
    Serial.println("An error occured while mounting LittleFS.");
  }

  // initialize the emulated EEPROM as large as needed
  int EEPROMSize = sizeof(timingconfig) + sizeof(bool);
  EEPROM.begin(EEPROMSize);

  // testing
  // setTimingConfig();

  // calculate EEPROM addresses 
  configAddr = STARTING_ADDR;
  autoEnableAddr = configAddr + sizeof(timingconfig);
  // load previous timing configuration from EEPROM if it exists
  getTimingConfig();
  getAutoEnable();
  Serial.println("configuration loaded from EEPROM: ");

  getTimingConfig();
  printTimingConfig();

  // pins
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  calculateBlinkDurations();
  setLED(LED_BLINK);

  // WiFi
  Serial.print("Connecting to "); 
  Serial.println(LOCAL_SSID);
  if (!WiFi.config(local_IP, gateway, subnet, primaryDNS, secondaryDNS)) {
    Serial.println("Station failed to configure.");
  }
  WiFi.begin(LOCAL_SSID, LOCAL_PASS); 
  // while (WiFi.status() != WL_CONNECTED) {
  //   delay(500); 
  //   Serial.print(".");
  // }
  //  print local IP address and start web server 
  printWiFi();

  // initialize websocket 
  initWebSocket(); 

  // route for root web page 
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/index.html", String(), false);});
  server.on("/styles.css", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/styles.css", "text/css", false);});
  server.on("/jquery.js", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/jquery.js", "text/javascript", false);});
  server.on("/s.js", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(LittleFS, "/s.js", "text/javascript", false);});
  server.begin();

  // init RTC 
  if (!rtc.begin()) {
    Serial.println("Couldn't find RTC.");
  }
  timeClient.begin();
  timeClient.setTimeOffset(tC.gmtOffset*3600); // GMT+8
  updateNTPTime(); 
  printNTPTime(timeClient);
  printRTCTime(dtnow);

  // File file = LittleFS.open("/index.html", "r");
  // if(!file){
  //   Serial.println("Failed to open file for reading");
  // }
  
  // Serial.println("File Content:");
  // while(file.available()){
  //   Serial.write(file.read());
  // }
  // file.close();
}

void loop() {
  // websocket loop
  ws.cleanupClients();
  // IO functions

  controlRelay();
  controlLED();
  checkButton();
  executeActionOnBtnPress();
  NTPUpdateLoop();
}

void printWiFi() {
  Serial.println(" ");
  Serial.println("WiFi connected.");
  Serial.print("WiFi SSID: ");
  Serial.println(WiFi.SSID());
  Serial.print("IP address: "); 
  Serial.println(WiFi.localIP()); 
  long rssi = WiFi.RSSI(); 
  Serial.print("Signal strength (RSSI): "); 
  Serial.print(rssi);
  Serial.println(" dBm");
}

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
      sendStatus();
    }
    else if (commandType == "time") {
      sendSystemDateTime();
    }
    // toggle the automatic relay timer 
    else if (commandType == "auto") {
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

// send status update to browser 
void sendStatus() {
  outputDoc.clear();
  outputDoc["type"] = "status";
  outputDoc["auto_enabled"] = autoEnabled;
  outputDoc["relay_status"] = relayState;
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

void checkTime() {
  dtnow = getCurDateTime();
}

void sendSystemDateTime() {
  checkTime();
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