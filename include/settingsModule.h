#include <Arduino.h>
#ifndef SETTINGSMODULE_H
#define SETTINGSMODULE_H 

typedef struct {
  byte hours[3];
  short duration; 
  byte gmtOffset;
} timingconfig;

void printTimingConfig();
void getAutoEnable();
void setAutoEnable();
void getTimingConfig();
void setTimingConfig();
bool checkHour(int hour);
bool* getActiveHours();
void setHour(int hour, bool newState); 
void setDuration(int newDuration);
void clearAllHours(); 

#endif