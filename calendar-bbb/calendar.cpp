#include <unistd.h>
#include <time.h>
#include <sys/wait.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "inputSampler.h"
#include "audioMixer.h"
#include "drumPlayer.h" 
#include "udp.h"	
#include "nightLight.h"

int main() 
{
	srand(time(NULL));

	nightLightInit();
	// create thread to play audio
	//AudioMixer_init();
	sleep(2);

	// create threads to receive inputs from user
	// and send commands to device
	//Drum_init();
    //Zencape_startSampling();
	UDP_start();

	sleep(600);

	// device clean up and join threads
	nightLightStop();
	UDP_stop();
	//Zencape_stopSampling();
	//Drum_stop();
	//AudioMixer_cleanup();

	return 0;
}
