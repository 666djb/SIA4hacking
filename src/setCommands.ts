export enum SetCommands {
    unset = 0, // 0 = Disarm area
    set = 1,       // 1 = Arm area
    partSet = 2,  // 2 = Partialy arm area
    reset = 3,     // 3 = Reset area
    abortSet = 4, // 4 = Abort arming of area
    forceSet = 5
}