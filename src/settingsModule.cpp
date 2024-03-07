#include <Arduino.h>
#include <ArduinoJson.h>
#include <EEPROM.h>
#include "settingsModule.h"
#include "constants.h"

// EEPROM 
unsigned int configAddr, autoEnableAddr, useNTPAddr;
extern StaticJsonDocument<150> inputDoc;

// persistent settings
timingconfig tC;
bool autoEnabled, useNTP; 

void printTimingConfig() {
  Serial.print("timeslots bytes = ");
  for (int i=0;i<3;i++) {
    Serial.print(tC.timeslots[i]);  
    if (i<2)
      Serial.print(", ");
    else Serial.print(" ");
  }
  Serial.print("duration = ");
  Serial.print(tC.duration);
  Serial.print(" ");

  Serial.print("gmt_offset = ");
  Serial.print(tC.gmtOffset);
  Serial.println();
}

// get the auto enable setting from the EEPROM
void getAutoEnable() {
  EEPROM.get(autoEnableAddr, autoEnabled);
}

// set the auto enable status from JSON and put it into the EEPROM
void setAutoEnable() {
  autoEnabled = inputDoc["auto_enabled"];
  EEPROM.put(autoEnableAddr, autoEnabled);
  EEPROM.commit();
}

// get timing configuration from the EEPROM
void getTimingConfig() {
  EEPROM.get(configAddr, tC);
}

// set the timing configuration from JSON and put it into the EEPROM
void setTimingConfig() {
  for (int i=0;i<3;i++) {
    tC.timeslots[i] = inputDoc["timeslots"][i];
  }
  tC.duration = inputDoc["duration"];
  tC.gmtOffset = inputDoc["gmt_offset"];
  // printTimingConfig();
  EEPROM.put(configAddr, tC);
  EEPROM.commit();
}

// get the use NTP setting from the EEPROM
void getUseNTP() {
  EEPROM.get(useNTPAddr, useNTP);
}

void setUseNTP() {
  useNTP = inputDoc["use_ntp"];
  EEPROM.put(useNTPAddr, useNTP);
  EEPROM.commit();
}

// check the state of a certain timeslot
bool checkTimeslot(int timeslot) {
  bool status;
  byte byteIndex = timeslot / 8; 
  byte bitIndex = timeslot % 8; 
  // byte currByte = tC.timeslots[byteIndex]; 
  // currByte = currByte >> bitIndex;
  // currByte = currByte & 1; 
  // status = (currByte) ? true: false;
  status = (tC.timeslots[byteIndex] >> bitIndex) & 1;
  return status;
}

// return a bool array with 24 elements representing the truth state of each timeslot
// in a day
bool* getActiveTimeslots() {
  static bool timeslots[24];
  // reset the timeslots array
  for (int h=0;h<24;h++) {
    timeslots[h] = 0;
  }
  // check each bit in the timeslots bytes then load it into the bool timeslots array 
  for (int h=0;h<24;h++) { 
    timeslots[h] = checkTimeslot(h);
  }
  return timeslots;
}

/* set the timeslot in the timing configuration to the specified state. 
args:
  tC - timingConfig object 
  timeslot - timeslot of the day from 0-24 
  newState - 0 for disable and 1 for enable 
*/ 
void setTimeslot(int timeslot, bool newState) {
  int byteIndex = timeslot / 8;
  int bitIndex = timeslot % 8; 
  int mask = 1 << bitIndex; 
  Serial.print("mask = ");
  // if enabling the timeslot
  if (newState) {
    tC.timeslots[byteIndex] = tC.timeslots[byteIndex] | mask;
  }
  // else disabling the timeslot
  else {
    mask = ~mask;
    tC.timeslots[byteIndex] = tC.timeslots[byteIndex] & mask;
  }
  Serial.println(mask);
}

// set the duration of the timing configuration 
void setDuration(int newDuration) {
  tC.duration = newDuration;
}

// macro function to clear all timeslots in the timeslots and reset interval to 0
void clearAllTimeslots() {
  setDuration(0);
  for (int h=0; h<24; h++) {
    setTimeslot(h, 0);
  }
}