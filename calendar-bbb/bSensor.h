// sampler.h
// Module to sample light levels in the background (thread).
// It provides access to a reading history of configurable
// length, the average light level, and the number of samples taken.
#ifndef _SAMPLER_H_
#define _SAMPLER_H_


// for now test
void Sampler_init(void);

// Begin/end the background thread which samples light levels.
void Sampler_startSampling();
void Sampler_stopSampling(void);


int samplingComplete(void);

#endif
