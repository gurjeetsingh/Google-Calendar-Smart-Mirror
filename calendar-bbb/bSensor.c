#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <stdbool.h>

#include "bSensor.h"
#include "sleep_util.h"


#define A2D_FILE_VOLTAGE1 "/sys/bus/iio/devices/iio:device0/in_voltage1_raw"


static bool brightFlag = true;

static int raw_reading;
static double voltage_reading = 0.0;


//Thread setup
static pthread_t tid;


void Sampler_init(void);
//void intialize_Buffer();

void Sampler_startSampling();//Main function to sample the light levels
//int insert_buff(double sample, int next_index, int* inserted, int* total_inserted);


void Sampler_stopSampling(void);
int samplingcomplete(void);




//Main function Starting the thread and taking samples
void Sampler_startSampling(){
    
    while(brightFlag != false){

        //printf("Sample %d\t", i+1);

        FILE *f = fopen(A2D_FILE_VOLTAGE1, "r");
        if (!f) {
            printf("ERROR: Unable to open voltage input file. Cape loaded?\n");
            printf(" Check /boot/uEnv.txt for correct options.\n");
            Sampler_stopSampling();        
        }   

        // Get reading
        int itemsRead = fscanf(f, "%d", &raw_reading);

        if (itemsRead <= 0) {
            printf("ERROR: Unable to read values from voltage input file.\n");  
        }

        voltage_reading = ((double)raw_reading / 4095) * 1.8;

        printf("current light sensor value is: %5.2fV\n", voltage_reading);

        // //Sample Reading potentiometer everytime we take a sample
        // startReadingPOT();

        // if voltage >1.4 full brightness
        // if voltage <1.3 75% brightness
        // if voltage < 1.0 50% brightness
        // if vlotage < 0.8 20% brightness
        if(voltage_reading > 1.4){
            //set brightness to 100%
        }

        else if(voltage_reading <= 1.3){
            //set brightness to 75%
        }

        else if(voltage_reading <=1.0){
            //set brightness to 50%
        }

        else if(voltage_reading < 0.8){
            //set brightness to 20%
        }
        
        fclose(f);//close the file

        //sleep(1); //sleep for a second before the next reading
        

    }

}

void Sampler_init(void){

    pthread_attr_t attr;
    pthread_attr_init(&attr);

    pthread_create(&tid, &attr, (void *)Sampler_startSampling,NULL);

    //error catching, maybe add later
}




void Sampler_stopSampling(void){
    
    printf("Stopping brightness sensor \n");
    brightFlag = false;
    pthread_join(tid, NULL);

    
    pthread_exit(0);
    //DipCalc_stopReading();
}
