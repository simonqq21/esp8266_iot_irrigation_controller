#include <Arduino.h>
#include "constants.h"
#include "ioModule.h"

void closeRelay(int seconds) {
    digitalWrite(RELAY_PIN, HIGH);
    
}