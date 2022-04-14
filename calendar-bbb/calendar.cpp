#include <unistd.h>
#include <time.h>
#include <sys/wait.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "udp.h"	
#include "nightLight.h"

int main() 
{
	srand(time(NULL));

	sleep(2);

	UDP_start();

	sleep(6000);

	UDP_stop();

	return 0;
}
