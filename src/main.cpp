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

// pins 
#define RELAY_PIN 14 // D5 
#define BUTTON_PIN 0 // D3
#define LED_PIN 2 // D4

// status variables 
byte hourBits[3];
int duration = 0;
bool relayClosed = false; 

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
  or  10000000 (1 << 7)
  ------------
  =   1xxxxxxx

  if changing a bit to 0, 
      xxxxxxxx
  and 01111111 (!(1 << 7))
  ------------
  =   1xxxxxxx

  TLDR: To switch a bit on, use bitwise or with a left shift, to switch a bit off, 
  use bitwise and with the inverse of a left shift. */

/* JSON formats: 
 - browser request status update from MCU 
{
  'type': 'status' (str)
}
 - sending relay status from MCU to browser: 
{
  'type': 'status', (str)
  'relay_status': true  (bool)
}
 - sending current settings from MCU to browser:
{
  'type': 'config', (str)
  'hours': {}, (array of 3 integers representing the three bytes stored in EEPROM)
  'duration': 10 (int)
}
 - sending updated settings from browser to MCU:
{
  'type': 'update_config', (str)
  'hours': {}, (array of 3 integers representing the three bytes stored in EEPROM)
  'duration': 10 (int)
}
 - send command from browser to enable the relay:
{
  'type': 'control',
  'relay_status': true (bool)
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
void printTime(int year, int month, int day, int hour, int minute, int second);
void printRTCTime(DateTime datetime); 
void printNTPTime(NTPClient timeClient);
void updateNTPTime();
void adjustRTCWithNTP(NTPClient timeClient, RTC_DS1307 rtc);



// void printTimingConfig(timingconfig tC);
// void loadFromEEPROM(unsigned int addr, timingconfig* tC);
// void saveToEEPROM(unsigned int addr, timingconfig tC);
// bool checkHour(timingconfig tC, int hour);
// bool* getActiveHours(timingconfig tC);
// void setHour(timingconfig* tC, int hour, bool newState); 
// void clearAllHours(timingconfig* tC); 
// void setDuration(timingconfig* tC, int newDuration);



void setup() {
  Serial.begin(115200); 

  // initialize EEPROM emulation
  EEPROM.begin(10); 
  
  // littleFS 
  if (!LittleFS.begin()) {
    Serial.println("An error occured while mounting LittleFS.");
  }

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // init RTC 
  if (!rtc.begin()) {
    Serial.println("Couldn't find RTC.");
    while (1);
  }

  /*
  on startup, pull time from RTC.
  when internet connected, update RTC with NTP. 
  when internet not connected, get time from RTC. 
  */

  Serial.print("Connecting to "); 
  Serial.println(LOCAL_SSID);
  if (!WiFi.config(local_IP, gateway, subnet)) {
    Serial.println("Station failed to configure.");
  }
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
    // //    send status JSON
    if (commandType == "status") {
      // sendStatusUpdate();
    }

  }
}

// initialize the websocket 
void initWebSocket() {
  ws.onEvent(onEvent);
  server.addHandler(&ws);
}

