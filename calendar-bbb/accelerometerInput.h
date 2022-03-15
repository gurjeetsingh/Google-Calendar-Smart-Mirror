#ifndef ACCELEROMETER_H
#define ACCELEROMETER_H

enum ACCELEROMETER_AXIS {
    ACCELEROMETER_NONE = -1,
    ACCELEROMETER_X = 0,
    ACCELEROMETER_Y,
    ACCELEROMETER_Z,
    ACCELEROMETER_COUNT,
};

void Accel_init();
void Accel_startSampling(void);
void Accel_stopSampling(void);

void* Axis_threading(void* arg);
void* Accel_threading(void* arg);



// return value read by accelerometer sampling thread
double Accelerometer_getAxis(enum ACCELEROMETER_AXIS axis);

// samples accelerometer readings for all axis; X, Y, Z
void Accelerometer_getValues();

//INITIALIZES i2C device for Accelerometer
int initI2cBus(char const *bus, int address);
// reads regs 0x00 to 0x06
int readI2cRegs(int i2cFileDesc, unsigned char* buff);

void writeI2cReg(int i2cFileDesc, unsigned char regAddr, unsigned char value);
#endif