#ifndef _GPIO_HELP_
#define _GPIO_HELP_

void Gpio_exportPin(int pin);
void Gpio_writeDirection(int pin, const char* value);
void Gpio_writeValue(int pin, const char* value);

#endif