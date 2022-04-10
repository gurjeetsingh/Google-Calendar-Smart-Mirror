// Zen Cape Driver

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <stdbool.h>
#include <assert.h>
#include <math.h>
#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <linux/i2c.h>
#include <linux/i2c-dev.h>
#include <pthread.h>
#include <unistd.h>
#include <time.h>
#include <sys/wait.h>
#include <sys/time.h>
#include <signal.h>	

#include "inputSampler.h"
#include "accelerometerInput.h"
#include "udp.h"

/**
 *  joystickInput.cpp samples accelerometer input from each of  
 *  the axis simultaneously
 */

/******************************************************
 * 				I2C - ACCELEROMETER
 * ***************************************************/


// Accelerometer address
#define I2C_DEVICE_ADDRESS 0x1C

// Register address
#define CTRL_REG1 0x2A
#define STATUS 0x00
// 8 MSBs of 12-bit sample + 4 LSBs of 12-bit sample
#define OUT_X_MSB 0x01
#define OUT_X_LSB 0x02
#define OUT_Y_MSB 0x03
#define OUT_Y_LSB 0x04
#define OUT_Z_MSB 0x05
#define OUT_Z_LSB 0x06


#define BUFF_SIZE 1024

typedef struct {
	enum ACCELEROMETER_AXIS axis;  // 0 = x, 1 = y, 2 = z
	double g_value;
    double threshold; 
} acceldata_t;


static acceldata_t a_vals[] = {
    {ACCELEROMETER_X,     0,   0.13},
    {ACCELEROMETER_Y,     0,   0.13},
    {ACCELEROMETER_Z,     0,   0.13},
};



double a_threshold[] = { 0.2, 0.2, 0.2 };

static bool stopThread = false;
static bool stopThreadAxis = false;

static pthread_t accelerometer_ThreadId;

static pthread_t *axis_ThreadIds;

static pthread_mutex_t accelerometerMutex = PTHREAD_MUTEX_INITIALIZER;

void Accel_init() {
    char const * I2CDRV_LINUX_BUS1 = "/dev/i2c-1";  
    int i2cFileDesc = initI2cBus(I2CDRV_LINUX_BUS1, I2C_DEVICE_ADDRESS);

    // Set Accelerometer mode to ACTIVE
    writeI2cReg(i2cFileDesc, CTRL_REG1, 0x01); // i2cset -y 1 0x1C 0x2A 0x01

    close(i2cFileDesc);

}

void Accel_startSampling(void) {
    Accel_init();

    printf("Starting accelerometer sampler...\n");
    // accelerometer sampling thread for all axis
    pthread_create(&accelerometer_ThreadId, NULL, Accel_threading, NULL);

    axis_ThreadIds = (pthread_t*)malloc(sizeof(pthread_t)*ACCELEROMETER_COUNT);

    for (int i = 0; i < ACCELEROMETER_COUNT; i++) {
        // thread safe access to a_vals[] 
        pthread_mutex_lock(&accelerometerMutex);
        acceldata_t curr_val = a_vals[i];
        curr_val.axis = (ACCELEROMETER_AXIS)i;

        printf("Starting axis thread %d ...\n", i);

        // thread which handles sampled data for an axis
        pthread_create(&axis_ThreadIds[i], NULL, Axis_threading, (void *)&curr_val);
        pthread_mutex_unlock(&accelerometerMutex);

        sleep_ms(50);
    }

}

void Accel_stopSampling(void) {
    printf("Stopping accelerometer sampler...\n");

    stopThread = true;
    pthread_mutex_lock(&accelerometerMutex);
    stopThreadAxis = true;
    pthread_mutex_unlock(&accelerometerMutex);
	
    sleep_ms(200);

    pthread_join(accelerometer_ThreadId, NULL);

    for (int i = 0; i < ACCELEROMETER_COUNT; i++) {
        // thread which handles sampled data for an axis
        pthread_join(axis_ThreadIds[i], NULL);
    }
    free(axis_ThreadIds);
}

// threading function for each of the accelerometer axis
void* Axis_threading(void* arg) {
    acceldata_t *pAccel;
    pAccel = (acceldata_t *)arg;

    // get axis of current thread
    enum ACCELEROMETER_AXIS thd_axis = pAccel->axis;
    int axis = (int)thd_axis;

	
    while (!stopThreadAxis) {

        // get axis value
        double g_val = Accelerometer_getAxis(thd_axis);

        // compare to threshold value
        if (fabs(g_val) > a_threshold[axis]) {
            // printf("axis %d: %lf\n", axis + 1,  g_val);

            //Drum_playOnce(axis);
            sleep_ms(200);
        }

        sleep_ms(10);

    }
    pthread_exit(NULL);
}

void* Accel_threading(void* arg) {

    pthread_mutex_lock(&accelerometerMutex);
    bool stop = stopThread;
    pthread_mutex_unlock(&accelerometerMutex);
    while (!stop) {
        // get accelerometer readings for each axis
        Accelerometer_getValues();

        sleep_ms(10);
        pthread_mutex_lock(&accelerometerMutex);
        stop = stopThread;
        pthread_mutex_unlock(&accelerometerMutex);
    }

    pthread_exit(NULL);


}    


// return value read by accelerometer sampling thread
double Accelerometer_getAxis(enum ACCELEROMETER_AXIS axis) {
    // thread safe access to a_vals[] 
    double axis_gval;
    pthread_mutex_lock(&accelerometerMutex);
    axis_gval = a_vals[(int)axis].g_value;
    pthread_mutex_unlock(&accelerometerMutex);

    return axis_gval;
}

// samples accelerometer readings for all axis; X, Y, Z
void Accelerometer_getValues() {

    char const * I2CDRV_LINUX_BUS1 = "/dev/i2c-1";  
    int i2cFileDesc = initI2cBus(I2CDRV_LINUX_BUS1, I2C_DEVICE_ADDRESS);
    unsigned char buff[BUFF_SIZE];
    readI2cRegs(i2cFileDesc, buff);

    close(i2cFileDesc);

    /*
        // left shifted 16 bits 10000000 0000 xxxx to 01111111 1111 xxxx
        int16_t x_16 = (buff[1] << 8) | (buff[2]);
        int16_t y_16 = (buff[OUT_Y_MSB] << 8) | (buff[OUT_Y_LSB]);
        int16_t z_16 = (buff[OUT_Z_MSB] << 8) | (buff[OUT_Z_LSB]);

        // left shift 16 bits into 12 bits
        double x_12 = (double)x_16 / 16;
        double y_12 = (double)y_16 / 16;
        double z_12 = (double)z_16 / 16;


        assume default: full scale range is 2g (1mg == 1g/1024)
        -> range -2g  10000000  0000  to +1.999g  01111111 1111
                    (  MSB  ) (LSB) 

    */

    for(int i = 0; i < ACCELEROMETER_COUNT; i++) {
        // left shifted 16 bits 10000000 0000 xxxx to 01111111 1111 xxxx
        int16_t axis_16 = (buff[1+i*2] << 8) | (buff[2+i*2]);
        // right shift 4 bits into 12 bits
        double axis_12 = (double)axis_16 / 16;
        
        //convert into G's 1mg == 1g/1024
        axis_12 = axis_12 / 1024;

        // subtract 1g from z axis for gravity
        if(i == ACCELEROMETER_Z) {
            axis_12 -= 1; 
        }
        // thread safe access to a_vals[] 
        pthread_mutex_lock(&accelerometerMutex);
        // write to a_val for axis handling threads
        a_vals[i].g_value = axis_12;
        pthread_mutex_unlock(&accelerometerMutex);

    }

}

//INITIALIZES i2C device for Accelerometer
int initI2cBus(char const *bus, int address) {
    int i2cFileDesc = open(bus, O_RDWR);
    int result = ioctl(i2cFileDesc, I2C_SLAVE, address);
    if (result < 0) {
        perror("I2C: Unable to set I2C device to slave address.");
        exit(1);
    }
    return i2cFileDesc;
}

// reads regs 0x00 to 0x06
int readI2cRegs(int i2cFileDesc, unsigned char* buff) {
    // start at 0x00
    unsigned char regAddr = STATUS; 
    // bytes covering regs 0x00 to 0x06
    int bytes = sizeof(regAddr) * 7;

    // Now read the value and return it
    int res = read(i2cFileDesc, buff, bytes);
    if (res != bytes) {
        perror("I2C: Unable to read from i2c register");
        exit(1);
    }
    return bytes;
}


void writeI2cReg(int i2cFileDesc, unsigned char regAddr, unsigned char value) {
    unsigned char buff[2];
    buff[0] = regAddr;
    buff[1] = value;
    int res = write(i2cFileDesc, buff, 2);
    if (res != 2) {
        perror("I2C: Unable to write i2c register.");
        exit(1);
	}
}

