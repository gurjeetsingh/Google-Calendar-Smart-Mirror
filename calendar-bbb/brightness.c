#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <stdbool.h>
#include "bSensor.h"
#include <pthread.h>



int main(int argc, char **argv)
{

    Sampler_init();
    

    sleep(10000000);
    

    Sampler_stopSampling();
    
    //Potentiometer_stopReading();
    

    //Wait for UDP shutdown

    

}