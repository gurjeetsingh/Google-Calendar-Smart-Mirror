# Makefile for building embedded application.
# by Brian Fraser

TARGET= calendar
OBJS = calendar.o udp.o nightLight.o gpio_help.o sleep_util.o potReading.o
SOURCES= 


PUBDIR = $(HOME)/cmpt433/public/myApps
OUTDIR = $(PUBDIR)
CROSS_TOOL = arm-linux-gnueabihf-
CC_CPP = $(CROSS_TOOL)g++
CC_C = $(CROSS_TOOL)gcc

CFLAGS = -Wall -g -std=c99 -D _POSIX_C_SOURCE=200809L -Werror
CPPFLAGS = -Wall -g -D _POSIX_C_SOURCE=200809L -Werror

OBJFLAGS = -Wall -g -D _POSIX_C_SOURCE=200809L


all: calendar.o gpio_help.o udp.o nightLight.o calendar 

calendar: $(OBJS)
	$(CC_CPP) $(CPPFLAGS) $(OBJS) -o $(OUTDIR)/$(TARGET) -lpthread

calendar.o: calendar.cpp 
	$(CC_CPP) $(OBJFLAGS) -c calendar.cpp -lpthread 

udp.o: udp.cpp
	$(CC_CPP) $(OBJFLAGS) -c udp.cpp -lpthread 

nightLight.o: nightLight.cpp
	$(CC_CPP) $(OBJFLAGS) -c nightLight.cpp -lpthread 

gpio_help.o: gpio_help.cpp
	$(CC_CPP) $(OBJFLAGS) -c gpio_help.cpp  

potReading.o: potReading.cpp
	$(CC_CPP) $(OBJFLAGS) -c potReading.cpp 

sleep_util.o: sleep_util.cpp
	$(CC_CPP) $(OBJFLAGS) -c sleep_util.cpp 	

clean:
	rm *.o $(OBJS)

