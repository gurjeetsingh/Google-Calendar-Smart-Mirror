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

int main() 
{
	srand(time(NULL));

	// create thread to play audio
	AudioMixer_init();
	sleep(2);

	// create threads to receive inputs from user
	// and send commands to device
	Drum_init();
    Zencape_startSampling();
	UDP_start();

	sleep(10000000);

	// device clean up and join threads
	UDP_stop();
	Zencape_stopSampling();
	Drum_stop();
	AudioMixer_cleanup();

	return 0;
}
