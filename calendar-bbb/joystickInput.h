enum JOYSTICK_DIRS {
    JOYSTICK_NONE = -1,
    JOYSTICK_UP = 0,
    JOYSTICK_DOWN,
    JOYSTICK_LEFT,
    JOYSTICK_RIGHT,
    JOYSTICK_CENTER,
    JOYSTICK_MAX_NUMBER_DIRECTIONS,
};

void Joystick_startSampling(void);

void Joystick_stopSampling(void);

// threading function for joystick sampling
void* Joystick_threading(void* arg);


void Joystick_init();


// returns JOYSTICK_DIRS direction
enum JOYSTICK_DIRS Joystick_getDirection();

// Export GPIO pin given PORT
void export_GPIO(int pinPort);