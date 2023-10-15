// SIA DC-03-1990.01 (R2000.11)

// Looks like the sequence needs to be:
// Connect Socket, Login, Receive Configuration Message, Send Command, Receive Extended Data, Socket Close. Then repeat.

import { Socket } from 'net'
import { SIABlock } from "./siaBlock"
import { FunctionCodes } from "./functionCodes"
import * as events from "events"

const ALARMHOST = "192.168.0.215" // IP or hostname of Flex alarm panel
const ALARMPORT = 10005 // TCP port number that the Flex alarm panel is accepting remote connects on
const PASSWORD = "543210" // Remote user password (this is the default)

enum Commands {
    unset = 0, // 0 = Disarm area
    set = 1,       // 1 = Arm area
    partSet = 2,  // 2 = Partialy arm area
    reset = 3,     // 3 = Reset area
    abortSet = 4, // 4 = Abort arming of area
    forceSet = 5
}

export class SIA4 extends events.EventEmitter {
    constructor() {
        super()
        let socket = new Socket()

        socket.on("data", (data: Buffer) => {
            console.log("Received data:", data)
            let siaBlock = SIABlock.fromBuffer(data)

            console.log(`Function code: ${FunctionCodes[siaBlock.funcCode]}\nData: ${siaBlock.data}`)

            // Respond if necessary
            switch (data[1]) {
                case FunctionCodes.configuration:
                    console.log("Got configuration message")
                    // TODO could decode configuration message to check we are talking the right language
                    // Currently this is AL4B15 - AL4 means SIA level 4 is being used.
                    
                    this.sendGetAllZonesOpenState(socket)

                    //this.sendGetZonesReady(socket)
                    //this.sendGetZoneState(socket)
                    break
                case FunctionCodes.extended:
                    // TODO need to check here what our last command was so we can decode it properly
                    // Need to use first part of the siaBlock.date e.g. ZS201* 
                    let zones = data.slice(8, data.length - 1)
                    console.log("Open Zones:", zones)
                    break
                case FunctionCodes.reject:
                    console.log("Command rejected")
                    break
                case FunctionCodes.alt_acknowledge:
                case FunctionCodes.acknowledge:
                default:
                    console.log("Other function code received")
                    break
            }

        })

        socket.on("close", () => {
            console.log("socket closed")
            // Reconnect after 5 seconds
            setTimeout(() => {
                this.connect(socket)
            }, 5000)
        })

        socket.on("connect", () => {
            console.log("Connected to socket")
        })

        this.connect(socket)
    }

    connect(socket: Socket) {
        socket.connect(ALARMPORT, ALARMHOST, () => {
            console.log("Connected to remote")
            this.doLogin(socket)
        })
    }

    doLogin(socket: Socket) {
        console.log("Doing login")
        let block = new SIABlock(FunctionCodes.remote_login, PASSWORD)
        let blockToSend = block.toBuffer(true, true)
        socket.write(blockToSend)
    }

    sendAck(socket: Socket) {
        let block = new SIABlock(FunctionCodes.acknowledge, "")
        let blockToSend = block.toBuffer(false, false)
        console.log("Ack:", blockToSend)
        socket.write(blockToSend)
    }

    sendAckAndStandby(socket: Socket) {
        let block = new SIABlock(FunctionCodes.ack_and_standby, "")
        let blockToSend = block.toBuffer(false, false)
        console.log("Ack and Standby:", blockToSend)
        socket.write(blockToSend)
    }

    sendAltAck(socket: Socket) {
        let block = new SIABlock(FunctionCodes.alt_acknowledge, "")
        let blockToSend = block.toBuffer(false, false)
        console.log("Ack:", blockToSend)
        socket.write(blockToSend)
    }

    sendEndOfData(socket: Socket) {
        let block = new SIABlock(FunctionCodes.end_of_data, "")
        let blockToSend = block.toBuffer(false, false)
        console.log("End of data:", blockToSend)
        socket.write(blockToSend)
    }

    sendWait(socket: Socket) {
        let block = new SIABlock(FunctionCodes.wait, "")
        let blockToSend = block.toBuffer(false, false)
        console.log("Ack and Standby:", blockToSend)
        socket.write(blockToSend)
    }

    sendGetZonesReady(socket: Socket) {
        let cmd = "ZS1"
        let block = new SIABlock(FunctionCodes.extended, cmd)
        let blockToSend = block.toBuffer(true, true)
        console.log("Get Zones Ready")
        socket.write(blockToSend)
    }

    // This works - next to decode the output
    sendGetAllZonesOpenState(socket: Socket) {
        let cmd = "ZS201" // ZS201 gets Zones 1-256, ZS202 gets Zones 257-512 (see Galaxy::GetAllZonesOpenState at line 842 in Galaxy.cpp)
        let block = new SIABlock(FunctionCodes.extended, cmd)
        let blockToSend = block.toBuffer(true, true)
        console.log("Get All Zones Open State")
        socket.write(blockToSend)
    }

    // This doesn't work, perhaps needs module number 
    sendGetEvents(socket: Socket) {
        let cmd = "EV"
        let block = new SIABlock(FunctionCodes.extended, cmd.toString())
        let blockToSend = block.toBuffer(true, true)
        console.log("Get Events")
        socket.write(blockToSend)
    }

    sendGetZoneState(socket: Socket) {
        let cmd = "ZS1021"
        let block = new SIABlock(FunctionCodes.extended, cmd.toString())
        let blockToSend = block.toBuffer(true, true)
        console.log("Get Zone State")
        socket.write(blockToSend)
    }

    // Not tested!
    sendDoControl(socket: Socket, command: Commands) {
        let block = new SIABlock(FunctionCodes.control, `SA*${command}`)
        let blockToSend = block.toBuffer(true, true)
        console.log(`Do Control: ${Commands[command]}`)
        socket.write(blockToSend)
    }
}
