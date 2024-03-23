#ifndef WSMODULE_H
#define WSMODULE_H 
#include <Arduino.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h> 
#include <ESPAsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include "settingsModule.h"
#include <RTClib.h>
#include <LittleFS.h>

void onEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType 
  type, void *arg, uint8_t *data, size_t len);
void handleWebSocketMessage(void *arg, uint8_t *data, size_t len);
void initServer();
void initWebSocket();
void sendSystemDateTime(); 
void sendStatus();
void sendAutoEnable();
void sendTimingConfig();

#endif