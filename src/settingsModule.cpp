#include <Arduino.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include "settingsModule.h"
#include "constants.h"

// EEPROM 
unsigned int configAddr, autoEnableAddr;
extern StaticJsonDocument<100> inputDoc;

// persistent settings
timingconfig tC;
bool autoEnabled;

void printTimingConfig() {
  Serial.print("hours bytes = ");
  for (int i=0;i<3;i++) {
    Serial.print(tC.hours[i]);  
    if (i<2)
      Serial.print(", ");
    else Serial.print(" ");
  }
  Serial.print("duration = ");
  Serial.print(tC.duration);
  Serial.print();

  Serial.print("gmt_offset = ");
  Serial.print(tC.gmtOffset);
  Serial.println();
}

// get the auto enable status from the EEPROM
void getAutoEnable() {
  EEPROM.get(autoEnableAddr, autoEnabled);
}

// set the auto enable status from JSON and put it into the EEPROM
void setAutoEnable() {
  autoEnabled = inputDoc["auto_enabled"];
  EEPROM.put(autoEnableAddr, autoEnabled);
}

// get timing configuration from the EEPROM
void getTimingConfig() {
  EEPROM.get(configAddr, tC);
}

// set the timing configuration from JSON and put it into the EEPROM
void setTimingConfig() {
  for (int i=0;i<3;i++) {
    tC.hours[i] = inputDoc["hours"][i];
  }
  tC.duration = inputDoc["duration"];
  tC.gmtOffset = inputDoc["gmt_offset"];
  // printTimingConfig();
  EEPROM.put(configAddr, tC);
  EEPROM.commit();
}

// check the state of a certain hour
bool checkHour(int hour) {
  bool status;
  byte byteIndex = hour / 8; 
  byte currByte = tC.hours[byteIndex]; 
  byte offset = hour % 8; 
  currByte = currByte >> offset;
  currByte = currByte & 1; 
  status = (currByte) ? true: false;
  return status;
}

// return a bool array with 24 elements representing the truth state of each hour
// in a day
bool* getActiveHours() {
  static bool hours[24];
  // reset the hours array
  for (int h=0;h<24;h++) {
    hours[h] = 0;
  }
  // check each bit in the hours bytes then load it into the bool hours array 
  for (int h=0;h<24;h++) { 
    hours[h] = checkHour(h);
  }
  return hours;
}

/* set the hour in the timing configuration to the specified state. 
args:
  tC - timingConfig object 
  hour - hour of the day from 0-24 
  newState - 0 for disable and 1 for enable 
*/ 
void setHour(int hour, bool newState) {
  int byteIndex = hour / 8;
  int bitIndex = hour % 8; 
  int mask = 1 << bitIndex; 
  Serial.print("mask = ");
  // if enabling the hour
  if (newState) {
    tC.hours[byteIndex] = tC.hours[byteIndex] | mask;
  }
  // else disabling the hour
  else {
    mask = ~mask;
    tC.hours[byteIndex] = tC.hours[byteIndex] & mask;
  }
  Serial.println(mask);
}

// set the duration of the timing configuration 
void setDuration(int newDuration) {
  tC.duration = newDuration;
}

// macro function to clear all hours in the hours and reset interval to 0
void clearAllHours() {
  setDuration(0);
  for (int h=0; h<24; h++) {
    setHour(h, 0);
  }
}