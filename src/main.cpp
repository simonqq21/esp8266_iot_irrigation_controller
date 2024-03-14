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
#include <Wire.h>
#include "constants.h"
#include "settingsModule.h"
#include "timeModule.h"
#include "ioModule.h"
#include "wsModule.h"

/*
settingsModule - getting and setting persistent settings to and from EEPROM
timeModule - getting and setting time between RTC and NTP 
ioModule - handle physical IO between button, relay, and LED
main - handle websocket client
*/

// transient settings
extern bool relayState;

// EEPROM 
extern unsigned int configAddr, autoEnableAddr;
extern timingconfig tC;
extern bool autoEnabled;

// RTC 
extern RTC_DS1307 rtc; 
extern DateTime dtnow; 

// NTP server 
extern long UTCOffsetInSeconds;
extern NTPClient timeClient; 

extern AsyncWebServer server; 
extern AsyncWebSocket ws; 

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

void setup() {
  Serial.begin(115200); 
  
  // littleFS 
  if (!LittleFS.begin()) {
    Serial.println("An error occured while mounting LittleFS.");
  }

  // initialize the emulated EEPROM as large as needed
  int EEPROMSize = sizeof(timingconfig) + sizeof(bool) * 2;
  EEPROM.begin(EEPROMSize);

  // testing
  // setTimingConfig();

  // calculate EEPROM addresses 
  configAddr = STARTING_ADDR;
  autoEnableAddr = configAddr + sizeof(timingconfig);
  
  // load previous timing configuration from EEPROM if it exists
  getConfig();
  getAutoEnable();
  Serial.println("configuration loaded from EEPROM: ");
  printConfig();

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
  Wire.begin();
  delay(1000);
  while (!rtc.begin()) {
    Serial.println("Couldn't find RTC.");
    delay(500);
  }

  timeClient.begin();
  
  updateNTPTime(); 
  
  getCurDateTime();
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
  getCurDateTime();
  NTPUpdateLoop();
  checkTime();
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