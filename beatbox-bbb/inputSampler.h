
#ifndef _ZENCAPE_H_
#define _ZENCAPE_H_






// void ZenCape_Init();

void Zencape_startSampling(void);
void Zencape_stopSampling(void);

// threading function for zen cape sampler
void* Zencape_threading(void* arg);



/******************************************************
 * 				GENERAL
 * ***************************************************/
/******************************************************
 * 				FILES
 * ***************************************************/
// write (char *) to fileName
void File_writeValue(const char* fileName, const char* value);

// return (int) bytes read from filename
void File_readValue(const char* fileName, char* buff, unsigned int length);

/******************************************************
 * 				TIME
 * ***************************************************/
void sleep_ms(unsigned int delayMs);

void setDebounce(bool* active, unsigned int ms) ;

#endif  // _ZENCAPE_H_