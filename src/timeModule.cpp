#include <Arduino.h>
#include "timeModule.h"

bool timeslots[24];
extern bool autoEnabled;
int curTimeslotIndex, prevTimeslotIndex;

// RTC 
RTC_DS1307 rtc; 
DateTime dtnow; 
DateTime targetTime;
int _year, _month, _day, _hour, _minute, _second; 

// NTP server 
long UTCOffsetInSeconds = 28800;
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "ntp.pagasa.dost.gov.ph"); 
unsigned long lastTimeRTCUpdated;
unsigned long lastTimeTimeChecked;
unsigned int updateRTCInterval = 5000;

void getCurDateTime() {
  dtnow = rtc.now(); 
  getYear();
  getMonth();
  getDay();
  getHour();
  getMinute();
  getSecond();
}

void printTime(int year, int month, int day, int _hour, int _minute, int _second) {
  Serial.print(year);
  Serial.print('/');
  Serial.print(month);
  Serial.print('/');
  Serial.println(day);
  Serial.print(' ');
  Serial.print(_hour); 
  Serial.print(":");
  Serial.print(_minute); 
  Serial.print(":");
  Serial.print(_second); 
  Serial.println();
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
  getCurDateTime();
  if (NTPUpdateStatus) {
    Serial.println("Updating RTC with NTP");
    adjustRTCWithNTP(timeClient, rtc);
  }
  else {
    Serial.println("NTP not available, using RTC time.");
  }
}

void adjustRTCWithNTP(NTPClient timeClient, RTC_DS1307 rtc) {
  unsigned long epochTime = timeClient.getEpochTime();
  _year = year(epochTime);
  _month = month(epochTime);
  _day = day(epochTime);
  _hour = timeClient.getHours();
  _minute = timeClient.getMinutes();
  _second = timeClient.getSeconds();
  adjustRTC(_year, _month, _day, _hour, _minute, _second);
  Serial.println("time adjusted from NTP to RTC.");
}

void adjustRTC(int _year, int _month, int _day, int _hour, int _minute, int _second) {
  rtc.adjust(DateTime(_year, _month, _day, _hour, _minute, _second));
}

void NTPUpdateLoop() {
  if (millis() - lastTimeRTCUpdated > updateRTCInterval) {
    lastTimeRTCUpdated = millis(); 
    updateNTPTime();
  }
}

int getYear() {
  _year = dtnow.year();
  return _year;
}

int getMonth() {
  _month = dtnow.month();
  return _month;
}

int getDay() {
  _day = dtnow.day();
  return _day;
}

int getHour() {
  _hour = dtnow.hour();
  return _hour;
}

int getMinute() {
  _minute = dtnow.minute();
  return _minute;
}

int getSecond() {
  _second = dtnow.second();
  return _second;
}

void checkTime() {
  if (millis() - lastTimeTimeChecked > 1000) {
    lastTimeTimeChecked = millis();

    getCurDateTime();
    curTimeslotIndex = _hour;
    
    if (curTimeslotIndex != prevTimeslotIndex) {
      if (curTimeslotIndex > 0) 
        prevTimeslotIndex = curTimeslotIndex - 1;
      else 
        prevTimeslotIndex = 23;
        timeslots[prevTimeslotIndex] = 0;
        prevTimeslotIndex = curTimeslotIndex;
    }

    if (autoEnabled) {
      bool curTimeslotState = checkTimeslot(curTimeslotIndex);
      // check if current time is within the interval
      targetTime = DateTime(_year, _month, _day, curTimeslotIndex, 0, 0);
      int tsDiff1 = (dtnow - targetTime).totalseconds();
      Serial.print(curTimeslotIndex);
      Serial.print(", ");
      Serial.print(curTimeslotState);
      Serial.print(", ");
      Serial.print(tsDiff1);
      Serial.print(", ");
      Serial.print(timeslots[curTimeslotIndex]);
      Serial.println();
      if (curTimeslotState && 
        tsDiff1 < INTERVAL_SECONDS &&
        !timeslots[curTimeslotIndex]) 
      {
        Serial.println("enabled relay from timer!");
        timeslots[curTimeslotIndex] = true; 
        setRelay(true);
      }
    }
  }
}
/*
24*4=96
x*(24/96) = hour 
x%(24/96)*60 = min
*/

void resetAllTimeslots() {
  for (int i=0;i<24;i++) {
    timeslots[i] = false;
  }
}