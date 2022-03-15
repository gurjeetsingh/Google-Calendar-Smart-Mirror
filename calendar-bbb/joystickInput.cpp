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

#include "joystickInput.h"
#include "inputSampler.h"
#include "audioMixer.h"
#include "drumPlayer.h"

/**
 * joystickInput.cpp samples joystick input from Zencape 
 * 
 */

// Joystick gpio pins
#define BUFF_SIZE 1024

struct JOYSTICK_PORTS {
	const char* name;
	const int portNumber;
    bool active;

};

// GPIO ports for joystick
struct JOYSTICK_PORTS j_ports[] = {
	{"Joystick_Up",     26},
	{"Joystick_Down",   46},
	{"Joystick_Left",   65},
	{"Joystick_Right",  47},
	{"Joystick_Center", 27},
};


static bool stopThread = false;

static pthread_t joystick_ThreadId;
static pthread_mutex_t joystickMutex = PTHREAD_MUTEX_INITIALIZER;


void Joystick_startSampling(void) {
    Joystick_init();
    printf("Starting joystick sampler...\n");
    pthread_create(&joystick_ThreadId, NULL, Joystick_threading, NULL);
}

void Joystick_stopSampling(void) {
    printf("Stopping joystick sampler...\n");
    stopThread = true;
    pthread_join(joystick_ThreadId, NULL);

}

// threading function for joystick sampling
void* Joystick_threading(void* arg) {
    while (!stopThread) {
        // get joystick readings
        enum JOYSTICK_DIRS j_direction = Joystick_getDirection();

        if (j_direction != JOYSTICK_NONE) {
            int dir = (int)j_direction;
            printf("Direction: %d\n", dir);
            // debounce axis for 200 ms
            setDebounce(&(j_ports[dir].active), 200);
        }
        int newVolume;
        switch (j_direction) {
            case JOYSTICK_UP: ; // increase volume
                newVolume = AudioMixer_getVolume() + 5;
                if (newVolume <= AUDIOMIXER_MAX_VOLUME) {
                    AudioMixer_setVolume(newVolume);
                }
                break;
            case JOYSTICK_DOWN: ; // decrease volume
                newVolume = AudioMixer_getVolume() - 5;
                if (newVolume >= 0) {
                    AudioMixer_setVolume(newVolume);
                }
                break;
            case JOYSTICK_LEFT : ; // decrease BPM
                Drum_decreaseBPM();
                break;
            case JOYSTICK_RIGHT: ; // increase BPM
                Drum_increaseBPM();
                break;
            case JOYSTICK_CENTER: ; // next drum beat mode
                Drum_nextMode();
            case JOYSTICK_NONE: ;
                break;
            
        }        

        sleep_ms(10);
    }    

    pthread_exit(NULL);

}


void Joystick_init() {
    // Export GPIO pins for joystick
	for (int i = 0; i < JOYSTICK_MAX_NUMBER_DIRECTIONS; i++) {
		// Export GPIO pin
		export_GPIO(j_ports[i].portNumber);
	}

	// Wait whiile exporting for GPIO pins
	sleep_ms(550);

	// set joystick pins as input 
	for (int i = 0; i < JOYSTICK_MAX_NUMBER_DIRECTIONS; i++) {

		char direction_fileName[BUFF_SIZE];  
		sprintf(direction_fileName,"/sys/class/gpio/gpio%d/direction", j_ports[i].portNumber);

		// Set direction of GPIO pin as input
		File_writeValue(direction_fileName, "in");
        
        // Set dir as active
        j_ports[i].active = true;
	}
}


// returns JOYSTICK_DIRS direction
enum JOYSTICK_DIRS Joystick_getDirection() {
    // Export GPIO pins for joystick
	for (int i = 0; i < JOYSTICK_MAX_NUMBER_DIRECTIONS; i++) {
        if(j_ports[i].active == true) {
            // Export GPIO pin
            char fileName[BUFF_SIZE];
            sprintf(fileName, "/sys/class/gpio/gpio%d/value", j_ports[i].portNumber);
            char buff[BUFF_SIZE];
            File_readValue(fileName, buff, BUFF_SIZE);
            // if value is 0, return direction
            if (atoi(&buff[0]) == 0) 
            {
                // setDebounce(&(j_ports[i].active), 1000);
                return static_cast<JOYSTICK_DIRS>(i);
            }
        }

	}
    return JOYSTICK_NONE;
}

// Export GPIO pin given PORT
void export_GPIO(int pinPort) {
	FILE *pFile = fopen("/sys/class/gpio/export", "w");
	if (pFile == NULL) {
		printf("ERROR: Unable to open export file.\n");
		exit(1);
	}
	fprintf(pFile, "%d", pinPort);
	fclose(pFile);
}