#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <time.h>
#include <string.h>
#include <stdbool.h>

#include "gpio_help.h"
#include "sleep_util.h"


void Gpio_exportPin(int pin){

    // Export Joystick input pin (configure for GPIO):

    char export_filename[50];
    sprintf(export_filename, "/sys/class/gpio/export");
	FILE *pExportFile = fopen(export_filename, "w");
	if (pExportFile == NULL) {
		printf("Error opening export file \n");
		exit(1);
	}
	fprintf(pExportFile, "%d", pin);
	fclose(pExportFile);

	// Allow enough time for GPIO export to complete
	sleep_ms(300);
}
void Gpio_writeDirection(int pin, const char* value){

    char fileName[50];
    
    sprintf(fileName, "/sys/class/gpio/gpio%d/direction", pin);
    FILE *pFile = fopen(fileName, "w");

    if (pFile == NULL){
        printf("Error: could not write to GPIO\n");
        exit(1);
    }
    fprintf(pFile, "%s", value);
    fclose(pFile);

}

void Gpio_writeValue(int pin, const char* value){

    char fileName[50];
    sprintf(fileName, "/sys/class/gpio/gpio%d/value", pin);

    FILE *pFile = fopen(fileName, "w");

    if (pFile == NULL){
        printf("Error: could not write to GPIO\n");
        exit(1);
    }
    fprintf(pFile, "%s", value);
    fclose(pFile);

}