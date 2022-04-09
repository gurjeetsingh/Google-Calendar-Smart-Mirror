# Makefile for building embedded application.
# by Brian Fraser

# Edit this file to compile extra C files into their own programs.
TARGET= calendar
#OBJS = inputSampler.o joystickInput.o accelerometerInput.o calendar.o audioMixer.o drumPlayer.o udp.o gpio_help.o nightLight.o potReading.o sleep_util.o
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

LFLAGS = -L$(HOME)/cmpt433/public/asound_lib_BBB
ADDFLAGS = -lasound

#all: inputSampler.o calendar.o audioMixer.o udp.o nightLight.o calendar 
all: calendar.o gpio_help.o udp.o nightLight.o calendar 
#calendar: $(OBJS)
#	$(CC_CPP) $(CPPFLAGS) $(OBJS) -o $(OUTDIR)/$(TARGET) $(LFLAGS) -lpthread -lasound
calendar: $(OBJS)
	$(CC_CPP) $(CPPFLAGS) $(OBJS) -o $(OUTDIR)/$(TARGET) -lpthread

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

