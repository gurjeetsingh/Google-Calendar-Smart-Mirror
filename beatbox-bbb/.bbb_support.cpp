// module redisbributed amongst other modules; see inputSampler.cpp


#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <stdbool.h>
#include <assert.h>

#include <fcntl.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include <linux/i2c.h>
#include <linux/i2c-dev.h>
#include <pthread.h>
#include <unistd.h>
#include <time.h>
#include <sys/wait.h>


/******************************************************
 * 				FILES
 * ***************************************************/

// write (char *) to fileName
void File_writeValue(const char* fileName, const char* value) {
	FILE *pFile = fopen(fileName, "w");
	if (!pFile) {
		printf("Error opening file %s\n", fileName);
		exit(1);
	}	
	fprintf(pFile, "%s", value);
	fclose(pFile);
}


// return (int) bytes read from filename
void File_readValue(const char* fileName, char* buff, unsigned int length) {
	FILE *pFile = fopen(fileName, "r");
	if (!pFile) {
		printf("Error opening file %s\n", fileName);
		exit(1);
	}	
	size_t maxLength = length;
	int bytes = getline(&buff, &(maxLength), pFile);
	fclose(pFile);
	if (bytes <= 0) {
		printf("Error reading file %s\n", fileName);
		exit(1);
	}
}

/******************************************************
 * 				TIME
 * ***************************************************/
void sleep_ms(unsigned int delayMs) {
	const unsigned int NS_PER_MS = 1000 * 1000;
	const unsigned int NS_PER_SECOND = 1000000000;

	unsigned long long delayNs = delayMs * NS_PER_MS;
	int seconds = delayNs / NS_PER_SECOND;
	int nanoseconds = delayNs % NS_PER_SECOND;

	struct timespec reqDelay = {seconds, nanoseconds};
	nanosleep(&reqDelay, (struct timespec *) NULL);
}
