#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <time.h>
#include <string.h>
#include <stdbool.h>

#include "sleep_util.h"
#include "nightLight.h"
#include "gpio_help.h"
#include "udp.h"

#define LED_BLUE_GPIO_PIN 48
#define LED_RED_GPIO_PIN 49     
#define LED_YELLOW_GPIO_PIN 69
#define LED_BUTTON_GPIO_PIN 44

#define SCREEN_BUTTON_GPIO_PIN 26

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
void* runNightLight(void* arg);

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

    Gpio_exportPin(LED_BUTTON_GPIO_PIN);

    Gpio_writeDirection(LED_BUTTON_GPIO_PIN, GPIO_IN);

    Gpio_exportPin(SCREEN_BUTTON_GPIO_PIN);

    Gpio_writeDirection(SCREEN_BUTTON_GPIO_PIN, GPIO_IN);    

}

static bool getButtonPressed(int gpio_pin){
    char fileName[BUFF_SIZE];
	sprintf(fileName, "/sys/class/gpio/gpio%d/value", gpio_pin); 
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
        
        bool led_button_pressed = false;
        bool screen_button_pressed = false;

        //&& temp_shutdown_value != 0
        while ((!led_button_pressed || !screen_button_pressed)&& !stop){
            sleep_ms(1);
            led_button_pressed = getButtonPressed(LED_BUTTON_GPIO_PIN);
            screen_button_pressed = getButtonPressed(SCREEN_BUTTON_GPIO_PIN);
        }
        
        if(led_button_pressed){
            // Turn on the LEDs
            if(num_of_leds_on < NUM_OF_LEDS){
                Gpio_writeValue(led_gpio_pins[index_of_next_LED_to_on],ON_LED);
                num_of_leds_on++;
                index_of_next_LED_to_on++;
                printf("Button pressed: Turn on LED\n");

            }else{
                for (int i = 0; i < NUM_OF_LEDS; i++)
                {
                    Gpio_writeValue(led_gpio_pins[i],OFF_LED);
                }
                num_of_leds_on = 0;
                index_of_next_LED_to_on = 0;
                printf("Turning off all LEDs\n");
            }
        }
        else if(screen_button_pressed){
            UDP_SetScreenButtonPressed();

        }
        

        //temp_shutdown_value--;
        //&& temp_shutdown_value != 0
        while ((getButtonPressed(LED_BUTTON_GPIO_PIN) || getButtonPressed(SCREEN_BUTTON_GPIO_PIN)) && !stop){
            sleep_ms(10);
            printf("waiting");
        }
    }

    //stop = true;
    printf("Exiting Night Light function\n");
    // Turn off LEDS before exiting
    for(int i = 0; i < NUM_OF_LEDS; i++){

        Gpio_writeValue(led_gpio_pins[i],OFF_LED);
        printf("NightLight Stop - Turning off LED\n");
    }
    sleep_ms(10);
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

