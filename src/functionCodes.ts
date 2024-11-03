export enum FunctionCodes {
    end_of_data        = 0x30, //48
    wait               = 0x31, //49
    abort              = 0x32, //50
    res_3              = 0x33, //51
    res_4              = 0x34, //52
    res_5              = 0x35, //53
    ack_and_standby    = 0x36, //54
    ack_and_disconnect = 0x37, //55
    acknowledge        = 0x38, //56
    alt_acknowledge    = 0x08, //8
    reject             = 0x39, //57
    alt_reject         = 0x09, //9
    // Info blocks
    control            = 0x43, //67
    environmental      = 0x45, //69
    new_event          = 0x4E, //78
    old_event          = 0x4F, //79
    program            = 0x50, //80
    // Special blocks
    configuration      = 0x40, //64
    remote_login       = 0x3F, //63
    account_id         = 0x23, //35
    origin_id          = 0x26, //38
    ascii              = 0x41, //65
    extended           = 0x58, //88
    listen_in          = 0x4C, //76
    vchn_request       = 0x56, //86
    vchn_frame         = 0x76, //118
    video              = 0x49  //73
}
