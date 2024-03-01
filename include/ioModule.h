#ifndef IOMODULE_H
#define IOMODULE_H 
#include <Arduino.h> 
#include "constants.h"

void closeRelay();
void controlRelay();
void checkButton();
void executeActionOnBtnPress();
void calculateBlinkDurations();
void setLED(int state);
void controlLED();

/* IO behavior: 
check button if it has been pressed 
If the auto timer has been enabled, continue closing the relay for the timeslots
it has been enabled. 
Else the relay will be opened all the time unless if it is manually closed from the
web interface or the hw button.
If the button has been pressed, close relay for the set duration before opening it.
light LED solid on when the relay is closed 
flash LED with a 0.2 Hz, 5% duty cycle pulse when the relay is open to indicate that
the device hasn't locked up.
*/

#endif