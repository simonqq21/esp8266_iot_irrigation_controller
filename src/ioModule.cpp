#include <Arduino.h>
#include "constants.h"
#include "ioModule.h"
#include <settingsModule.h>

// global state variables 
bool btnState, lastBtnState, trigBtnState, btnPressed; 
unsigned long lastDebounceTime; 
int debounceDelay = 100;
bool relayState;
unsigned long timer, timerStart;
bool ledValue;
int ledState;  // 0 for off, 1 for on, 2 for blink
unsigned int ledOnTime, ledOffTime, previousLEDTime;
extern timingconfig tC;

// sets the relay timer to the specified number of seconds and closes the relay
void setRelay(bool relayValue) {
    relayState = relayValue;
    if (relayState) {
        setLED(LED_ON);
        timerStart = millis();
        timer = tC.duration * 1000;
    }
    else {
        setLED(LED_BLINK);
        timer = 0;
    }
}

// this function must be put in the main loop to control the relay
void controlRelay() {
    if (millis() - timerStart >= timer) {
        relayState = 0;
        setLED(LED_BLINK);
    }
    // Serial.print(millis() - timerStart);
    // Serial.print(" >= ");
    // Serial.println(timer);
    digitalWrite(RELAY_PIN, relayState);
}

// this function must be put in the main loop to check the button in a nonblocking 
// fashion
void checkButton() {
    btnState = digitalRead(BUTTON_PIN);
    if (btnState != lastBtnState) {
        lastDebounceTime = millis();
        trigBtnState = !btnState;
        lastBtnState = btnState;
    }

    if (millis() - lastDebounceTime > debounceDelay) {
        lastDebounceTime = millis();
        if (!btnState && trigBtnState) {
            Serial.print("button pressed ");
            btnPressed = 1;
            trigBtnState = btnState;
        }
    }
}

// this function must be put in the main loop to set the relay timer and close
// the relay when the button is pressed
void executeActionOnBtnPress() {
    if (btnPressed) {
        // execute button press action
        // if relay is on, a button press would turn it off.
        if (relayState) {
            setRelay(false);
        }
        else {
            setRelay(true);
        }
        // reset buttonPressed value
        btnPressed = 0;
    }
}

// this function must be put in setup to calculate the LED blink period lengths
void calculateBlinkDurations() {
    ledOnTime = LED_PERIOD * 1000 * LED_DC;
    ledOffTime = LED_PERIOD * 1000 * (1.0 - LED_DC);
}

// set the LED to either LED_OFF, LED_ON, or LED_BLINK
void setLED(int state) {
    ledState = state;
}

// this function must be put in the main loop to control the LED/
void controlLED() {
    switch (ledState)
    {
    case LED_OFF:
        ledValue = 0;
        break;
    case LED_ON:
        ledValue = 1;
        break;
    case LED_BLINK:
        // switch LED off after it exceeds on time
        if (millis() - previousLEDTime > ledOnTime && ledValue) {
            previousLEDTime = millis();
            ledValue = LOW;
        }
        // switch LED on after it exceeds off time
        else if (millis() - previousLEDTime > ledOffTime && !ledValue) {
            previousLEDTime = millis();
            ledValue = HIGH;
        }
        break;
    default:
        ledValue = 0;
        break;
    }
    digitalWrite(LED_PIN, ledValue);
}