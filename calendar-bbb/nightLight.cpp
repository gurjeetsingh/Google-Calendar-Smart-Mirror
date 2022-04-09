#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <time.h>
#include <string.h>
#include <stdbool.h>

#include "sleep_util.h"
#include "nightLight.h"
#include "gpio_help.h"

#define LED_BLUE_GPIO_PIN 48
#define LED_RED_GPIO_PIN 49     
#define LED_YELLOW_GPIO_PIN 69
#define BUTTON_GPIO_PIN 68

#define GPIO_OUT "out"
#define GPIO_IN "in"

#define ON_LED "0"
#define OFF_LED "1"

#define NUM_OF_LEDS 3
#define BUFF_SIZE 1024

int led_gpio_pins[NUM_OF_LEDS] = {48,49,69};

static bool stop = false;

static pthread_t night_light_thread;

static int readLineFromFile(char* file_name, char* buff, unsigned int max_length);
void* runNightLight();

void nightLightInit(){
    pthread_create(&night_light_thread, NULL, runNightLight,NULL);
}

void nightLightStop(){
    stop = true;
    pthread_join(night_light_thread, NULL);
}

static void InitializeLEDPins(){

    for(int i = 0; i < NUM_OF_LEDS; i++){
        Gpio_exportPin(led_gpio_pins[i]);
        //sleep_ms(300);
        
        Gpio_writeDirection(led_gpio_pins[i], GPIO_OUT); 
        Gpio_writeValue(led_gpio_pins[i],OFF_LED);
    }

}

static void InitializeButtonPin(){

    Gpio_exportPin(BUTTON_GPIO_PIN);

    Gpio_writeDirection(BUTTON_GPIO_PIN, GPIO_IN);

}

static bool getButtonPress(){
    char fileName[BUFF_SIZE];
	sprintf(fileName, "/sys/class/gpio/gpio%d/value", BUTTON_GPIO_PIN); 
	char buff[BUFF_SIZE];
	readLineFromFile(fileName, buff, BUFF_SIZE);
	return buff[0] == '1';
}


//////******************MAIN FUNCTION*************************//////
//////********************************************************//////

void* runNightLight(void* arg){

    printf("entering Night Light Function\n");
    // Initialize the GPIO pins
    InitializeLEDPins();
    InitializeButtonPin();

    int num_of_leds_on = 0;
    int index_of_next_LED_to_on = 0;

    //int temp_shutdown_value = 8;

    while(!stop){
        
        bool button_pressed = false;

        //&& temp_shutdown_value != 0
        while (!button_pressed && !stop){
            sleep_ms(1);
            button_pressed = getButtonPress();
        }
        
        // Turn on the LEDs

        if(num_of_leds_on < NUM_OF_LEDS){
            Gpio_writeValue(led_gpio_pins[index_of_next_LED_to_on],ON_LED);
            num_of_leds_on++;
            index_of_next_LED_to_on++;

        }else{
            for (int i = 0; i < NUM_OF_LEDS; i++)
            {
                Gpio_writeValue(led_gpio_pins[i],OFF_LED);
            }
            num_of_leds_on = 0;
            index_of_next_LED_to_on = 0;
        }

        //temp_shutdown_value--;
        //&& temp_shutdown_value != 0
        while (getButtonPress() && !stop){
            sleep_ms(10);
        }
    }

    //stop = true;
    printf("Exiting Night Light function\n");
    pthread_exit(NULL);
}




//////******************HELPER FUNCTION*************************//////
//////********************************************************//////

static int readLineFromFile(char* file_name, char* buff, unsigned int length)
{
	FILE *file = fopen(file_name, "r");
	if (file == NULL) {
		printf("FILEIODRV ERROR: Unable to open file for read: %s\n", file_name);
		exit(-1);
	}

	// Read string (line)
    size_t max_length = length;
	int bytes_read = getline(&buff, &(max_length), file);

	// Close
	fclose(file);

	// Null terminate "string" being returned
	buff[bytes_read] = 0;

	return bytes_read;
}

