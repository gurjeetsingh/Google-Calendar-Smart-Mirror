# Makefile for building embedded application.
# by Brian Fraser

# Edit this file to compile extra C files into their own programs.
TARGET= calendar
OBJS = inputSampler.o joystickInput.o accelerometerInput.o calendar.o audioMixer.o drumPlayer.o udp.o
SOURCES= 


PUBDIR = $(HOME)/cmpt433/public/myApps
OUTDIR = $(PUBDIR)
CROSS_TOOL = arm-linux-gnueabihf-
CC_CPP = $(CROSS_TOOL)g++
CC_C = $(CROSS_TOOL)gcc

CFLAGS = -Wall -g -std=c99 -D _POSIX_C_SOURCE=200809L -Werror
CPPFLAGS = -Wall -g -D _POSIX_C_SOURCE=200809L -Werror

OBJFLAGS = -Wall -g -D _POSIX_C_SOURCE=200809L

LFLAGS = -L$(HOME)/cmpt433/public/asound_lib_BBB
ADDFLAGS = -lasound

all: inputSampler.o calendar.o audioMixer.o udp.o calendar 

calendar: $(OBJS)
	$(CC_CPP) $(CPPFLAGS) $(OBJS) -o $(OUTDIR)/$(TARGET) $(LFLAGS) -lpthread -lasound

audioMixer.o: audioMixer.cpp 
	$(CC_CPP) $(OBJFLAGS) -c audioMixer.cpp -lpthread 

drumPlayer.o: drumPlayer.cpp 
	$(CC_CPP) $(OBJFLAGS) -c drumPlayer.cpp -lpthread 	

calendar.o: calendar.cpp 
	$(CC_CPP) $(OBJFLAGS) -c calendar.cpp -lpthread 

inputSampler.o: inputSampler.cpp 
	$(CC_CPP) $(OBJFLAGS) -c inputSampler.cpp -lpthread 

joystickInput.o: joystickInput.cpp 
	$(CC_CPP) $(OBJFLAGS) -c joystickInput.cpp -lpthread 

accelerometerInput.o: accelerometerInput.cpp 
	$(CC_CPP) $(OBJFLAGS) -c accelerometerInput.cpp -lpthread 

udp.o: udp.cpp
	$(CC_CPP) $(OBJFLAGS) -c udp.cpp -lpthread 

clean:
	rm *.o $(OBJS)

