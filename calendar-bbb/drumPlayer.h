#ifndef DRUM_H
#define DRUM_H

enum DRUM_MODE {
	STANDARD = 0,
	DOUBLE_TIME,
	GHOST_16,
	NONE
};

enum DRUM_KIT {
	HI_HAT = 0,
	SNARE,
	BASE,
};

void Drum_init(void);

void* Drum_threading(void* arg);

void Drum_stop();

// increases BPM if less than MAX_BPM
void Drum_increaseBPM();

// decreases BPM if greater than MIN_BPM
void Drum_decreaseBPM();

void Drum_nextMode();

void Drum_setMode(int newMode);

void Drum_playOnce(int axis);

int Drum_getBPM();

void Drum_setBPM(int newBPM);

int Drum_getMode();
#endif