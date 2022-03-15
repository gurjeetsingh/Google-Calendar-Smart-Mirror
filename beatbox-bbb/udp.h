#ifndef UDP_H
#define UDP_H

void UDP_start(void);
void UDP_stop(void);

void* UDP_listen(void* arg);
void str2cmd(char *messageRx, int command[2]);

#endif