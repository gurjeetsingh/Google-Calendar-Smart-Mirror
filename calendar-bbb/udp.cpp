#include <stdio.h>
#include <stdlib.h>
#include <netdb.h>
#include <string.h>			// for strncmp()
#include <unistd.h>			// for close()
#include <pthread.h>
#include <ctype.h>
#include <time.h>

#include "udp.h"	
#include "audioMixer.h"
#include "drumPlayer.h" 
#include "potReading.h"

#define MSG_MAX_LEN 11000
#define PORT        12345


#define NUM_COMMANDS 5

char const *commandStr[5] = {
    "pot"
};

enum COMMANDS {
	POT = 0,
	UNKNOWN,
	ALERT
};


// ************************************
// NOTE : commands will come from client web
//        through udp_server.c

struct CommandMapping {
	enum COMMANDS command;
	const char* input;
};


static pthread_t udp_ThreadId;
static bool terminationTriggered = false;

static bool screen_button_pressed = false;

void UDP_start(void) {
    printf("Starting udp...\n");
    pthread_create(&udp_ThreadId, NULL, UDP_listen, NULL);
}

void UDP_stop(void) {
    printf("Stopping udp...\n");
    terminationTriggered = true;
    pthread_join(udp_ThreadId, NULL);

}


void* UDP_listen(void* arg) {
	// Address
	struct sockaddr_in sin;
	memset(&sin, 0, sizeof(sin));
	sin.sin_family = AF_INET;                   // Connection may be from network
	sin.sin_addr.s_addr = htonl(INADDR_ANY);    // Host to Network long
	sin.sin_port = htons(PORT);                 // Host to Network short
	
	// Create the socket for UDP
	int socketDescriptor;
    if ( (socketDescriptor = socket(AF_INET, SOCK_DGRAM, 0)) < 0 ) {
        perror("socket creation failed");
        exit(EXIT_FAILURE);
    }

	// Bind the socket to the port (PORT) that we specify
	if(bind (socketDescriptor, (struct sockaddr*) &sin, sizeof(sin)) < 0 ) {
        perror("bind failed");
        exit(EXIT_FAILURE);
    }

    while(!terminationTriggered) {
		// Get the data (blocking)
		// Will change sin (the address) to be the address of the client.
		// Note: sin passes information in and out of call!
		struct sockaddr_in sinRemote;
		unsigned int sin_len = sizeof(sinRemote);
		char messageRx[MSG_MAX_LEN];

		// Pass buffer size - 1 for max # bytes so room for the null (string data)
		int bytesRx = recvfrom(socketDescriptor,
			messageRx, MSG_MAX_LEN - 1, 0,
			(struct sockaddr *) &sinRemote, &sin_len);

		// Make it null terminated (so string functions work)
		messageRx[bytesRx] = 0;

		// Extract the command and arg from the message
		int parsedCommand[2];
        str2cmd(messageRx, parsedCommand);

		int cmd = parsedCommand[0];
		printf("COMMAND %d\n", cmd);
		//int param = parsedCommand[1];

		char messageTx[MSG_MAX_LEN];
		int newVolume;	
		int newBPM;
		int initialTime = clock();
        switch (cmd) {
	        case POT: ;
				
				sprintf(messageTx, "pot %d", getSelectedSector());
				printf("sector is %d\n", getSelectedSector());
				sendto( socketDescriptor,
						messageTx, strlen(messageTx),
						0,
						(struct sockaddr *) &sinRemote, sin_len);					
				break;
			default:
				sprintf(messageTx, "Unknown Commmakeand\n\n");
				sendto( socketDescriptor,
						messageTx, strlen(messageTx),
						0,
						(struct sockaddr *) &sinRemote, sin_len);	
				break;
        }
		
		char screenMessage[MSG_MAX_LEN];

		if(screen_button_pressed){
			screen_button_pressed = false;
			sprintf(screenMessage, "screen 1");
			printf("UDP screen button clicked\n");
			sendto( socketDescriptor,
						screenMessage, strlen(screenMessage),
						0,
						(struct sockaddr *) &sinRemote, sin_len);
		}
		if(terminationTriggered) 
		{
			break;
		}
	}

	// Close
	close(socketDescriptor);


    pthread_exit(0);
}

// HELPER FUNCTION FOR SCREEN BRIGHTNESS BUTTON FROM NIGHT LIGHT //

void UDP_SetScreenButtonPressed(){
	screen_button_pressed = true;
}

void str2cmd(char *messageRx, int command[2]) {
		char *pMsg = strtok(messageRx, " ");
		char *aMsg[2]; // store space separated strings here

		int i = 0;
		while(pMsg != NULL) {
			aMsg[i] = pMsg;
			printf("'%s'\n", pMsg);
			pMsg = strtok(NULL, " ");
			i++;
		}
		i = 0;
		for (i = 0; i < UNKNOWN; i++) {
			if(strstr(aMsg[0], commandStr[i]) != NULL) {
					command[0] = i;
					break;
			}
		}
		if (i != UNKNOWN) {
			command[1] = atoi(aMsg[1]);
		}
}
