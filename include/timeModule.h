#ifndef TIMEMODULE_H
#define TIMEMODULE_H
#include <Arduino.h>
#include <NTPClient.h> 
#include <WiFiUdp.h>
#include <TimeLib.h>
#include <RTClib.h>

void printTime(int year, int month, int day, int hour, int minute, int second);
void printRTCTime(DateTime datetime); 
void printNTPTime(NTPClient timeClient);
void updateNTPTime();
void adjustRTCWithNTP(NTPClient timeClient, RTC_DS1307 rtc);

#endif