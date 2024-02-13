#include <Arduino.h>
#include "constants.h"
#include "ioModule.h"

// global state variables 
bool btnState, lastBtnState, trigBtnState, btnPressed; 
unsigned long lastDebounceTime; 
int debounceDelay = 150;
bool relayState;
unsigned long lastTimeSet;
unsigned long timeRemaining;

void closeRelay(int seconds) {
    digitalWrite(RELAY_PIN, HIGH);
    
    digitalWrite(RELAY_PIN, LOW);
}

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

void executeActionOnBtnPress() {
    if (btnPressed) {
        // execute button press action

        // reset buttonPressed 
        btnPressed = 0;
    }
}