#ifndef TIMEMODULE_H
#define TIMEMODULE_H
#include <Arduino.h>
#include <NTPClient.h> 
#include <WiFiUdp.h>
#include <TimeLib.h>
#include <RTClib.h>
#include "ioModule.h"
#include "settingsModule.h"

#define INTERVAL_SECONDS 300

void printTime(int year, int month, int day, int hour, int minute, int second);
void printRTCTime(DateTime datetime); 
void printNTPTime(NTPClient timeClient);
void updateNTPTime();
void adjustRTCWithNTP(NTPClient timeClient, RTC_DS1307 rtc);
void adjustRTC(int _year, int _month, int _day, int hour, int minute, int second);
void getCurDateTime();
int getYear();
int getMonth();
int getDay();
int getHour();
int getMinute();
int getSecond();
void NTPUpdateLoop();
void checkTime();
void resetAllTimeslots();

#endif