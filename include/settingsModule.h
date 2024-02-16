#include <Arduino.h>
#ifndef SETTINGSMODULE_H
#define SETTINGSMODULE_H 

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

// data structure for storing config in EEPROM 
/*
  hours contains the bytes used to store the hours among the 24 hours in a day
    when the relay is opened or closed
  duration is how long the relay will be closed every time it is closed
  gmtOffset is the offset in hours from UTC 
  enableTimer enables or disables the automatic periodic behavior of the relay
*/
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