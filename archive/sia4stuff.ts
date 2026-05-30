// SIA DC-03-1990.01 (R2000.11)

// Looks like the sequence needs to be:
// Connect Socket, Login, Receive Configuration Message, Send Command, Receive Extended Data, Socket Close. Then repeat.

import { Socket } from 'net'
import { SIABlock } from "./siaBlock"
import { FunctionCodes } from "./functionCodes"
import * as events from "events"
import { Commands } from "./sia4Commands"
import { SetCommands } from "./setCommands"

export class SIA4 extends events.EventEmitter {
    private command: Commands

    constructor(command: Commands) {
        super()

        this.command = command
        let socket = new Socket()

        socket.on("data", (data: Buffer) => {
            //console.log(`Received data[${data.length}] in decimal: ${[...data]}`)
            let siaBlock = SIABlock.fromBuffer(data)

            //console.log(`Function code: ${FunctionCodes[siaBlock.funcCode]}\nData: ${siaBlock.data}`)

            // Respond if necessary
            switch (data[1]) {
                case FunctionCodes.configuration:
                    //console.log("Got configuration message")
                    // TODO could decode configuration message to check we are talking the right language
                    // Currently this is AL4B15 - AL4 means SIA level 4 is being used.

                    switch (this.command) {
                        case Commands.getZoneState:
                            this.sendGetZoneState(socket, 1021) // TODO: yes this is hardcoded to zone 1021 for testing - fix this.
                            break
                        case Commands.getAllZonesOpenState:
                            this.sendGetAllZonesOpenState(socket, 1) // TODO: second parameter is to indicate first half of zones or second half, hardcoded here - fix this.
                            break
                        case Commands.doSet:
                            this.sendDoControl(socket, SetCommands.set)
                            break
                        case Commands.doPartSet:
                            this.sendDoControl(socket, SetCommands.partSet)
                            break
                        case Commands.doUnset:
                            this.sendDoControl(socket, SetCommands.unset)
                            break
                        default:
                            console.log("Bad command")
                    }

                    break
                case FunctionCodes.extended:
                    let delimiterPosition = siaBlock.data.indexOf("*")
                    if (delimiterPosition > 6) {
                        console.log("Extended response delimiter in wrong place, index:", delimiterPosition)
                        break
                    }

                    let cmd = siaBlock.data.slice(0, delimiterPosition)

                    switch (cmd.slice(0, 2)) {
                        case "ZS": // Zone state
                            if (cmd.slice(2) === "201") { // First half of all zones, i.e. Zones 1-256
                                //console.log("Got multiple zone state (ZS201)")
                                let openZones = this.decodeMultipleZones(siaBlock.data.slice(delimiterPosition + 1, data.length))
                                if (openZones.length > 0) {
                                    console.log("Open zones:", openZones)
                                }
                            } else if (delimiterPosition == 6) { // Single zone state because it has ZS and a four character number
                                this.emit("status", `Zone ${cmd.slice(2, 6)} : ${this.decodeSingleZone(cmd.slice(2, 6), siaBlock.data.slice(delimiterPosition + 1, data.length /*- 1*/))}`)
                            } else {
                                console.log("Error got weird zone state")
                            }
                            break
                        default:
                            console.log("Got some other extended cmd response:", cmd.toString())
                    }
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
            //console.log("socket closed")
            this.emit("close")

            // Reconnect after 5 seconds
            setTimeout(() => {
                this.connect(socket)
            }, 5000)

        })

        socket.on("connect", () => {
            //console.log("Connected to socket")
        })

        this.connect(socket)
    }

    connect(socket: Socket) {
        socket.connect(ALARMPORT, ALARMHOST, () => {
            //console.log("Connected to remote")
            this.doLogin(socket)
        })
    }

    doLogin(socket: Socket) {
        //console.log("Doing login")
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

    // This works
    // TODO: decode the output that is returned
    sendGetAllZonesOpenState(socket: Socket, half: number) {
        let cmd = "ZS20" + half // ZS201 gets Zones 1-256, ZS202 gets Zones 257-512 (see Galaxy::GetAllZonesOpenState at line 842 in Galaxy.cpp)
        //console.log("cmd:", cmd)
        let block = new SIABlock(FunctionCodes.extended, cmd)
        let blockToSend = block.toBuffer(true, true)
        //console.log("Get All Zones Open State")
        socket.write(blockToSend)
    }

    // This doesn't work, perhaps needs a module number?
    sendGetEvents(socket: Socket) {
        let cmd = "EV"
        let block = new SIABlock(FunctionCodes.extended, cmd.toString())
        let blockToSend = block.toBuffer(true, true)
        console.log("Get Events")
        socket.write(blockToSend)
    }

    sendGetZoneState(socket: Socket, zone: number) {
        // TODO: could parse the zone number here
        let cmd = "ZS" + zone
        let block = new SIABlock(FunctionCodes.extended, cmd.toString())
        let blockToSend = block.toBuffer(true, true)
        console.log("Get Zone State")
        socket.write(blockToSend)
    }

    // Not tested!
    sendDoControl(socket: Socket, command: SetCommands) {
        let block = new SIABlock(FunctionCodes.control, `SA*${command}`)
        let blockToSend = block.toBuffer(true, true)
        console.log(`Do Control: ${SetCommands[command]}`)
        socket.write(blockToSend)
    }


    /**
     * Maps a string of characters representing multiple bytes to an array of active zones.
     * 
     * - 1st byte (index 0) represents zones 1001-1008
     * - 2nd byte (index 1) represents zones 1011-1018
     * - 3rd byte (index 2) represents zones 1021-1028
     * - ... and so on (1001 + index * 10 to 1008 + index * 10)
     * 
     * @param {string} zoneData - The string.
     * @returns {number[]|null} An array of active zone numbers.
     */
    private decodeMultipleZones(zoneData: string) {
        const activeZones: number[] = [];
        for (let i = 0; i < zoneData.length; i++) {
            const charCode = zoneData.charCodeAt(i);
            const baseZone = 1001 + i * 10;
            for (let bit = 0; bit < 8; bit++) {
                if ((charCode & (1 << bit)) !== 0) {
                    activeZones.push(baseZone + bit);
                }
            }
        }
        return activeZones;
    }

    private decodeSingleZone(zone: string, zoneData: string): string {
        /* From Galaxy.hpp
            enum class zone_state : unsigned int {
                tamper_sc = 0, // 0 = Zone tamper S/C
                low_r,         // 1 = Low resistance
                closed,        // 2 = Zone closed
                high_r,        // 3 = High resistance
                open,          // 4 = Zone open
                tamper_oc,     // 5 = Zone tamper O/C
                masked,        // 6 = Zone masked
                tamper_cv,     // 7 = Zone tamper CV
                fault          // 8 = Zone fault
            };
        */
        let zoneDataValue = Number(zoneData[0])
        if (isNaN(zoneDataValue) || zoneDataValue < 0 || zoneDataValue > 8) {
            return "Bad zoneData"
        }
        const zoneState = ["Tamper SC", "Low Resistance", "Closed", "High Resistance", "Open", "Tamper OC", "Masked", "Tamper CV", "Fault"]
        return zoneState[Number(zoneData[0])]
    }

    // private toBinary(integer: number, withPaddingLength: number) {
    //     let str = integer.toString(2);
    //     return str.padStart(withPaddingLength, "0");
    // }

}
