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
bool* hours;
bool relay = false; 

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
/* JSON formats:
 - From browser to MCU 
   - browser request status update from MCU 
  {
    'type': 'status'
  }
  - Toggle the automatic relay timer. Enabling the automatic relay timer will enable
  the daily relay hours, and disabling the automatic relay timer will simply 
  disable the daily relay hours so the only time the relay closes is if the user
  manually toggles the momentary relay button on the webpage or the physical button.
  This command is sent by the browser right away after the user toggles the automatic
  toggle.
  {
    'type': 'auto',
    'auto_enabled': bool
  }
  - sending updated settings from browser to MCU
  {
    'type': 'chg_settings',
    'hours': array of 3 bytes representing the three bytes stored in EEPROM,
    'duration': int from 0 to 60,
    'gmt_offset': int from -12 to 12,
  }
   - send command from browser to enable the relay momentarily for the saved duration.
  {
    'type': 'relay',
    'relay_status': bool 
  }

 - From MCU to browser 
  - sending relay status from MCU to browser
  {
    'type': 'status',
    'auto_enabled': bool,
    'relay_status': bool
  }
   - sending current settings from MCU to browser
  {
    'type': 'settings', 
    'hours': array of 3 bytes representing the three bytes stored in EEPROM,
    'duration': int from 0 to 60,
    'gmt_offset': int from -12 to 12,
  }
*/

// async web server
AsyncWebServer server(80); 
AsyncWebSocket ws("/ws"); 
StaticJsonDocument<100> inputDoc;
StaticJsonDocument<100> outputDoc;
char strData[100];

// wifi credentials
// #define LOCAL_SSID "wifi"
// #define LOCAL_PASS "password"

//static IP address configuration 
IPAddress local_IP(192,168,5,75);
IPAddress gateway(192,168,5,1);
IPAddress subnet(255,255,255,0);
//IPAddress primaryDNS(8,8,8,8);
//IPAddress secondaryDNS(8,8,4,4);

//for littlefs
File indexPage;  

void printWiFi(); 
void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType 
  type, void *arg, uint8_t *data, size_t len);
void handleWebSocketMessage(void *arg, uint8_t *data, size_t len);
void initWebSocket();
void sendStatus();
void sendTimingConfig();

void setup() {
  Serial.begin(115200); 

  // testing 
  // inputDoc.clear();
  // JsonArray hours = inputDoc.createNestedArray("hours");
  // for (int i=0;i<3;i++) {
  //   hours.add((i+1)*8);
  // }
  // inputDoc["duration"] = 30;
  // inputDoc["gmt_offset"] = 8;
  
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

  tC.duration = 2;
  printTimingConfig();

  // pins
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  calculateBlinkDurations();
  setLED(LED_BLINK);

  // init RTC 
  if (!rtc.begin()) {
    Serial.println("Couldn't find RTC.");
  }

  // WiFi
  Serial.print("Connecting to "); 
  Serial.println(LOCAL_SSID);
  if (!WiFi.config(local_IP, gateway, subnet)) {
    Serial.println("Station failed to configure.");
  }
  WiFi.begin(LOCAL_SSID, LOCAL_PASS); 
  // while (WiFi.status() != WL_CONNECTED) {
  //   delay(500); 
  //   Serial.print(".");
  // }
  //  print local IP address and start web server 
  printWiFi();

  // initialize NTP 
  timeClient.begin();
  timeClient.setTimeOffset(UTCOffsetInSeconds); // GMT+8

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

  File file = LittleFS.open("/index.html", "r");
  if(!file){
    Serial.println("Failed to open file for reading");
  }
  
  Serial.println("File Content:");
  while(file.available()){
    Serial.write(file.read());
  }
  file.close();
}

void loop() {
  // websocket loop
  ws.cleanupClients();
  // IO functions

  controlRelay();
  controlLED();
  checkButton();
  executeActionOnBtnPress();
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
    Serial.println((char*)data);
    if (error) {
      Serial.print("deserializeJson failed: ");
      Serial.println(error.f_str());
    }
    else 
      Serial.println("deserializeJson success");
      
    String commandType = inputDoc["type"];
    // send status JSON
    if (commandType == "status") {
      getAutoEnable();
      sendStatus();
    }
    // toggle the automatic relay timer 
    else if (commandType == "auto") {
      setAutoEnable();
    }
    // send persistent settings JSON
    else if (commandType == "settings") {
      getTimingConfig();  
      sendTimingConfig();
    }
    // save persistent settings to EEPROM 
    else if (commandType == "chg_settings") {
      setTimingConfig();
    }
    // close the relay momentarily from user manual input 
    else if (commandType == "relay") {
      closeRelay();
    }
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
  outputDoc["relay_status"] = relay;
  serializeJson(outputDoc, strData);
  ws.textAll(strData);
}

// send persistent settings to browser
void sendTimingConfig() {
  outputDoc.clear(); 
  outputDoc["type"] = "settings";
  JsonArray hours = outputDoc.createNestedArray("hours");
  for (int i=0;i<3;i++) {
    hours.add(tC.hours[i]);
  }
  outputDoc["duration"] = tC.duration;
  outputDoc["gmt_offset"] = tC.gmtOffset;
  serializeJson(outputDoc, strData);
  ws.textAll(strData);
}