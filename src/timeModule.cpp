#include <Arduino.h>
#include "timeModule.h"

// RTC 
RTC_DS1307 rtc; 
DateTime dtnow; 

// NTP server 
long UTCOffsetInSeconds = 28800;
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "ntp.pagasa.dost.gov.ph"); 
unsigned long lastTimeRTCUpdated;
int updateRTCInterval = 5000;
DateTime getCurDateTime() {
  dtnow = rtc.now(); 
  return dtnow;
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
  dtnow = getCurDateTime();
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
  int _year = year(epochTime);
  int _month = month(epochTime);
  int _day = day(epochTime);
  int hour = timeClient.getHours();
  int minute = timeClient.getMinutes();
  int second = timeClient.getSeconds();
  rtc.adjust(DateTime(_year, _month, _day, hour, minute, second));
  Serial.println("time adjusted from NTP to RTC.");
}

void NTPUpdateLoop() {
  if (millis() - lastTimeRTCUpdated > updateRTCInterval) {
    lastTimeRTCUpdated = millis(); 
    updateNTPTime();
  }
}