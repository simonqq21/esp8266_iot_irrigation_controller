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
#include "wifiModule.h"

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

// webserver
extern AsyncWebServer server; 
extern AsyncWebSocket ws; 

// wifi 
extern unsigned long checkAddr, ssidAddr, passAddr, ipIndexAddr;
extern int checkNum; 
extern String ssid, pass;

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

//for littlefs
File indexPage;  

void printWiFi(); 

void setup() {
  Serial.begin(115200); 
  
  // littleFS 
  if (!LittleFS.begin()) {
    Serial.println("An error occured while mounting LittleFS.");
  }

  // calculate EEPROM addresses 
  checkAddr = START_ADDR;
  ssidAddr = checkAddr + sizeof(int);
  passAddr = ssidAddr + sizeof(char) * 32;
  ipIndexAddr = passAddr + sizeof(char) * 32;
  configAddr = ipIndexAddr + sizeof(int);
  autoEnableAddr = configAddr + sizeof(timingconfig);

  // initialize the emulated EEPROM as large as needed
  int EEPROMSize = sizeof(int) + 2 * sizeof(char) * 32 + sizeof(int) + 
    sizeof(timingconfig) + sizeof(bool);
  EEPROM.begin(EEPROMSize);

  // testing
  // setTimingConfig();
  
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
  getWiFiEEPROMValid();
  checkResetButton(BUTTON_PIN);
  Serial.print(checkNum); 
  validateWiFiEEPROM();

  Serial.print("Connecting to "); 
  Serial.println(ssid);
  // if (!WiFi.config(local_IP, gateway, subnet, primaryDNS, secondaryDNS)) {
  //   Serial.println("Station failed to configure.");
  // }
  WiFi.begin(ssid, pass); 

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
  checkWiFiLoop();
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