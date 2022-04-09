#include <stdlib.h>
#include <stdbool.h>
#include <stdio.h>
#define A2D_FILE_VOLTAGE0 "/sys/bus/iio/devices/iio:device0/in_voltage0_raw"
#define A2D_VOLTAGE_REF_V 1.8
#define A2D_MAX_READING 4095

#define A2D_VOLTAGE_TO_SECTOR_CUTOFF 0.15

static int getVoltage0Reading(){
    // Open file
    FILE *f = fopen(A2D_FILE_VOLTAGE0, "r");
    if (!f) {
        printf("ERROR: Unable to open voltage input file. Cape loaded?\n");
        printf(" Check /boot/uEnv.txt for correct options.\n");
        exit(-1);
    }

    // Get reading
    int a2dReading = 0;
    int itemsRead = fscanf(f, "%d", &a2dReading);
    if (itemsRead <= 0) {
        printf("ERROR: Unable to read values from voltage input file.\n");
        exit(-1);
    }
    // Close file
    fclose(f);
    return a2dReading;
}

int getSelectedSector(){

    int reading = getVoltage0Reading();
    double voltage = ((double)reading / A2D_MAX_READING) * A2D_VOLTAGE_REF_V;

    
    int sector = voltage == 0 ? 0 : (int)(voltage/A2D_VOLTAGE_TO_SECTOR_CUTOFF);
    return sector;
    //printf("Value %5d ==> %5.2fV, sector = %d\n", reading, voltage, sector);

}

