	// description here
#include "drumPlayer.h" 
#include "audioMixer.h"
#include "inputSampler.h"

#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <assert.h>

#define DEFAULT_BPM 120
#define SAMPLE_SIZE (sizeof(short))

#define MIN_BPM 40
#define MAX_BPM 300

/**
 * drumPlayer.cpp plays drums sounds and can change drum modes.
 * Also can increase or decrease the BPM
 * 
 */
char const *soundFileDirectory = "./../beatbox-wav-files/";

typedef struct {
	enum DRUM_KIT piece;
	char const *fileName;
	wavedata_t *pSound;
} drumsounds_t;

char const *soundPaths[3] = {
    "./../beatbox-wav-files/100053__menegass__gui-drum-cc.wav",
    "./../beatbox-wav-files/100059__menegass__gui-drum-snare-soft.wav",
    // "./../beatbox-wav-files/100051__menegass__gui-drum-bd-hard.wav"	
	"./../beatbox-wav-files/100052__menegass__gui-drum-bd-soft.wav"	
};

static drumsounds_t soundFiles[3];


int standard_eight[8][3] = {
    {true,    false,    true},
    {true,    false,   false},
    {true,    true,    false},
	{true,    false,   false},
	{true,    false,    true},
	{true,    false,   false},
    {true,    true,    false},
	{true,    false,   false},
};

// I'm walking on sunshine~~
int double_time[16][3] = {
    {true,    false,    true},
    {false,   false,   false},

    {true,    true,    false},
	{false,   false,   false},

	{true,    false,    true},
	{false,   false,   false},

    {true,    true,    false},
	{false,   false,    true},

    {true,    false,   false},
	{false,   false,    true},

    {true,    true,    false},
	{false,   false,    true},	

    {true,    false,    true},
    {false,   false,   false},

    {true,    true,    false},
	{false,   false,   false},
};

// a homage to band 10; replace with ghost if sound exists
int ghost_16th[16][3] = {
    {true,    false,   false},
    {false,   true,    false},
    {true,    false,   false},
	{false,   false,    true},

    {true,    true,    false},	
    {false,   false,   false},
    {true,    false,   false},
	{false,   true,    false},

    {true,    false,   false},
    {false,   true,    false},
    {true,    false,   false},
	{false,   false,    true},

    {true,    true,    false},	
    {false,   false,    true},
    {true,    false,   false},
	{false,   true,    false},
};

static pthread_mutex_t soundMutex = PTHREAD_MUTEX_INITIALIZER;

enum DRUM_MODE mode = STANDARD;
int numModes = 4;


int bpm = DEFAULT_BPM;


// In simple quadruple time 4/4
// divide into 16th notes
int nthNotes = 16;


// duration of each note e.g. 16th note -> 1/16 of whole note
// double noteDuration = (double)1/nth_notes;

int notesPerBeat = 4;

bool playDrum = true;

static pthread_t drumming_ThreadId;


void Drum_init(void) {

	for (int i = 0; i <= BASE; i++) {

		soundFiles[i].pSound = new wavedata_t;
		soundFiles[i].fileName = soundPaths[i];
		soundFiles[i].piece = (DRUM_KIT)i;

		assert(soundFiles[i].pSound);

		AudioMixer_readWaveFileIntoMemory(soundFiles[i].fileName, soundFiles[i].pSound);
		// printf("filename: %s\n", soundFiles[i].fileName);
	}
	pthread_create(&drumming_ThreadId, NULL, Drum_threading, NULL);
}

// thread safe adding of sound to queue
void Drum_playOnce(int axis) {
	pthread_mutex_lock(&soundMutex);
	AudioMixer_queueSound(soundFiles[axis].pSound);	
	pthread_mutex_unlock(&soundMutex);
	return;
}

void* Drum_threading(void* arg) {

	int noteCount = 0; // n nth notes per bar
	while(playDrum) {
		noteCount %= nthNotes;

		double secondsPerBeat = (double)(60)/bpm;

		// secondsPerBeat divided by # of notes per beat
		double noteDuration = secondsPerBeat/(nthNotes/4);
		
		// add sound to AudioMixer queue
		switch (mode) {
			case STANDARD:
				if(noteCount % 2 == 0)
				for (int i = 0; i <= BASE; i++) {
					bool play = standard_eight[noteCount/2][i];
					if(play) {
						// thread safe access to soundFiles[]
						pthread_mutex_lock(&soundMutex);
						AudioMixer_queueSound(soundFiles[i].pSound);	
						pthread_mutex_unlock(&soundMutex);

					}
				}
				break;
			case DOUBLE_TIME:

				for (int i = 0; i <= BASE; i++) {
					bool play = double_time[noteCount][i];
					if(play) {
						// thread safe access to soundFiles[]
						pthread_mutex_lock(&soundMutex);
						AudioMixer_queueSound(soundFiles[i].pSound);	
						pthread_mutex_unlock(&soundMutex);

					}
				}
				break;
			case GHOST_16:
				for (int i = 0; i <= BASE; i++) {
					bool play = ghost_16th[noteCount][i];
					if(play) {
						// thread safe access to soundFiles[]
						pthread_mutex_lock(&soundMutex);
						AudioMixer_queueSound(soundFiles[i].pSound);
						pthread_mutex_unlock(&soundMutex);						
					}
				}				
				break;
			case NONE:
				break;
		}

		sleep_ms(noteDuration * 1000);
		noteCount++;
		
	}
	pthread_exit(NULL);
}

void Drum_stop() {
	playDrum = false;
	for (int i = 0; i <= BASE; i++) {
		AudioMixer_freeWaveFileData(soundFiles[i].pSound);
	}
}

// increases BPM if less than MAX_BPM
void Drum_increaseBPM() {

	printf("increasing BPM + 5\n");
	if(bpm + 5 <= MAX_BPM) {
		bpm += 5;
	}	
}

// decreases BPM if greater than MIN_BPM
void Drum_decreaseBPM() {

	printf("decreasing BPM - 5\n");
	if(bpm - 5 >= MIN_BPM) {
		bpm -= 5;
	}	
}

void Drum_setBPM(int newBPM) {
	if(newBPM == bpm) return;

	printf("New BPM %d\n", newBPM);
	if(newBPM >= MIN_BPM && newBPM <= MAX_BPM) {
		bpm = newBPM;
	}	
}

void Drum_nextMode() {
	printf("next drum mode\n");
	int newMode = (mode + 1) % numModes;
	mode = (DRUM_MODE)newMode;
}

// used by udp.c
void Drum_setMode(int newMode) {
	printf("switching to drum mode %d\n", newMode);
	mode = (DRUM_MODE)newMode;
}

int Drum_getMode() {
	return (int)mode;
}

int Drum_getBPM() {
	return bpm;
}