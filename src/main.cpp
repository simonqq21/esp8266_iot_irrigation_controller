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
#include "module1.h"
#include "settingsModule.h"
#include "constants.h"

/*
settingsModule - getting and setting persistent settings to and from EEPROM
timeModule - getting and setting time between RTC and NTP 
ioModule - handle physical IO between button, relay, and LED
main - handle websocket client
*/

// data structure for storing config in EEPROM 
/*
  hours contains the bytes used to store the hours among the 24 hours in a day
    when the relay is opened or closed
  duration is how long the relay will be closed every time it is closed
  gmtOffset is the offset in hours from UTC 
  enableTimer enables or disables the automatic periodic behavior of the relay
*/

// pins 
#define RELAY_PIN 14 // D5 
#define BUTTON_PIN 0 // D3
#define LED_PIN 2 // D4

// transient settings
bool* hours;
bool relay = false; 

// EEPROM 
extern unsigned int configAddr, autoEnableAddr;
extern timingconfig tC;
extern bool autoEnabled;

// RTC 
RTC_DS1307 rtc; 
DateTime dtnow; 

// NTP server 
const long UTCOffsetInSeconds = 28800;
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "ntp.pagasa.dost.gov.ph"); 


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

// configuration variables 
/*  The configuration variables are the ff:
- a list of three bytes where the 24 hours per day are represented. The data is 
stored in little endian order, so the organization of 24 hours into three bytes
will be arranged as below:

address |       00                    01                       02
hours   | 7 6 5 4 3 2 1 0 | 15 14 13 12 11 10 9 8 | 23 22 21 20 19 18 17 16

so if a bit is high, the relay will close contacts for the set duration at the start
of that hour before opening contacts for the rest of the hour, but if that bit is 
low, then the relay will remain open contact for that hour.

eg. if the relay must close at 7AM and remain open the rest of the time,
7 / 8 = 0, byte 0.  0000 0111 >> 3 = 0
7 % 8 = 7, 7th bit. 0000 0111 & 
change byte 0, 7th bit to 1. 
    xxxxxxxx
OR  10000000 (1 << 7)
------------
=   1xxxxxxx

if changing a bit to 0, 
    xxxxxxxx
AND 01111111 (!(1 << 7))
------------
=   1xxxxxxx

Perform modulo 8 by AND of the number and 00000111.

TLDR: 
  To get a certain bit, first integer divide the hour by 8 to get the nth
  byte, bitwise shift right the nth byte by the modulo of the hour and 8, then
  AND the result with 00000001 to get a 1 or a 0. 
  To switch a bit on, use bitwise OR with a left shift, to switch a bit off, 
use bitwise AND with the inverse of a left shift. 
*/

/* JSON formats:
 - browser request status update from MCU 
{
  'type': 'status'
}
 - sending relay status from MCU to browser
{
  'type': 'status',
  'auto_enabled': bool,
  'relay_status': bool
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
 - sending current settings from MCU to browser
{
  'type': 'settings', 
  'hours': array of 3 bytes representing the three bytes stored in EEPROM,
  'duration': int from 0 to 60,
  'gmt_offset': int from -12 to 12,
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
*/


// async web server
AsyncWebServer server(80); 
AsyncWebSocket ws("/ws"); 
StaticJsonDocument<100> inputDoc;
StaticJsonDocument<100> outputDoc;
char strData[100];

// wifi credentials
#define LOCAL_SSID "wifi"
#define LOCAL_PASS "password"

//static IP address configuration 
// IPAddress local_IP(192,168,5,75);
// IPAddress gateway(192,168,5,1);
// IPAddress subnet(255,255,255,0);
//IPAddress primaryDNS(8,8,8,8);
//IPAddress secondaryDNS(8,8,4,4);

//for littlefs
File indexPage;  

void printWiFi(); 
void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType 
  type, void *arg, uint8_t *data, size_t len);
void handleWebSocketMessage(void *arg, uint8_t *data, size_t len);
void initWebSocket();

void printTime(int year, int month, int day, int hour, int minute, int second);
void printRTCTime(DateTime datetime); 
void printNTPTime(NTPClient timeClient);
void updateNTPTime();
void adjustRTCWithNTP(NTPClient timeClient, RTC_DS1307 rtc);



void sendStatus();
void sendTimingConfig();

void setup() {
  Serial.begin(115200); 
  print_hello();

  // testing 
  // inputDoc.clear();
  // JsonArray hours = inputDoc.createNestedArray("hours");
  // for (int i=0;i<3;i++) {
  //   hours.add((i+1)*8);
  // }
  // inputDoc["duration"] = 30;
  // inputDoc["gmt_offset"] = 8;
  

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
  printTimingConfig();

  // littleFS 
  if (!LittleFS.begin()) {
    Serial.println("An error occured while mounting LittleFS.");
  }

  // pins
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // init RTC 
  if (!rtc.begin()) {
    Serial.println("Couldn't find RTC.");
    // while (1);
  }

  // WiFi
  Serial.print("Connecting to "); 
  Serial.println(LOCAL_SSID);
  // if (!WiFi.config(local_IP, gateway, subnet)) {
  //   Serial.println("Station failed to configure.");
  // }
  WiFi.begin(LOCAL_SSID, LOCAL_PASS); 
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); 
    Serial.print(".");
  }
  //  print local IP address and start web server 
  printWiFi();

  // initialize NTP 
  timeClient.begin();
  timeClient.setTimeOffset(UTCOffsetInSeconds); // GMT+8

  // initialize websocket 
  initWebSocket(); 
}

void loop() {
  // put your main code here, to run repeatedly:
  ws.cleanupClients();
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

void printRTCTime(DateTime datetime) {
  Serial.println("RTC time: ");
  printTime(datetime.year(), datetime.month(), datetime.day(), 
    datetime.hour(), datetime.minute(), datetime.second());
  // Serial.print(datetime.dayOfTheWeek(), DEC); 
  // Serial.print(' '); 
  // Serial.println(daysOfTheWeek[datetime.dayOfTheWeek()]);
  // Serial.println();
}

void printNTPTime(NTPClient timeClient) {
  unsigned long epochTime = timeClient.getEpochTime();
  Serial.println("NTP time: ");
  printTime(year(epochTime), month(epochTime), day(epochTime), 
    timeClient.getHours(), timeClient.getMinutes(), timeClient.getSeconds());
  // Serial.print(timeClient.getFormattedTime());
  // Serial.print(' ');
  // Serial.print(timeClient.getDay());
  // Serial.println();
}

void printTime(int year, int month, int day, int hour, int minute, int second) {
  Serial.print(year);
  Serial.print('/');
  Serial.print(month);
  Serial.print('/');
  Serial.println(day);
  Serial.print(' ');
  Serial.print(hour); 
  Serial.print(":");
  Serial.print(minute); 
  Serial.print(":");
  Serial.print(second); 
  Serial.println();
}

/*
Update the RTC and local time with NTP time only if the ESP can connect to the 
NTP server
*/
void updateNTPTime() {
  // check if can access NTP server
  timeClient.update();
  bool NTPUpdateStatus = timeClient.isTimeSet(); 
  // printNTPTime(timeClient);
  // Serial.print("NTP update status: ");
  // Serial.println(NTPUpdateStatus);
  /*
  when NTP successfully connected, update RTC with NTP. 
  else get time from RTC. 
  */
  if (NTPUpdateStatus) {adjustRTCWithNTP(timeClient, rtc);}
}

void adjustRTCWithNTP(NTPClient timeClient, RTC_DS1307 rtc) {
  unsigned long epochTime = timeClient.getEpochTime();
  int _year = year(epochTime);
  int _month = month(epochTime);
  int _day = day(epochTime);
  int hour = timeClient.getHours();
  int minute = timeClient.getMinutes();
  int second = timeClient.getSeconds();
  rtc.adjust(DateTime(_year, _month, _day, hour, minute, second));
  Serial.println("time adjusted from NTP to RTC.");
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













