import * as events from "events"
import { Socket } from 'net'
import { SIABlock } from "./siaBlock"
import { FunctionCodes } from "./functionCodes"
import { SIA4Commands } from "./sia4Commands"
import { SetCommands } from "./setCommands"

export class SIA4 extends events.EventEmitter {
    private socket: Socket

    private host: string
    private port: number
    private password: string

    constructor(host: string, port: number, password: string) { // Creates connection and listeners for data, close and error events
        super()

        this.host = host
        this.port = port
        this.password = password

        this.socket = new Socket()

        this.socket
            .on("connect", () => {
                //console.log("Socket connected")
            })
            .on("data", (data: Buffer) => {
                this.onDataReceived(data)
            })
            .on("close", () => {
                this.emit("close")

                //     // Reconnect after 5 seconds
                //     setTimeout(() => {
                //         this.connect(host, port)
                //     }, 5000)
            })
    }

    public connect() {
        //console.log("Attempting connection to alarm")
        this.socket.connect(this.port, this.host, () => {
            //console.log("Connected to alarm")
            this.doLogin(this.password)
        })
    }

    public close() {
        this.socket.end()
    }

    private onDataReceived(data: Buffer) {
        let siaBlock = SIABlock.fromBuffer(data)

        // Respond if necessary
        switch (data[1]) {
            case FunctionCodes.configuration:
                if (siaBlock.data !== "AL4B15") {
                    console.log("Incorrect configuration")
                } else {
                    this.emit("ready")
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
                                this.emit("zonesOpen", openZones)
                            } else {
                                this.emit("zonesOpen", null)
                            }
                        } else if (delimiterPosition == 6) { // Single zone state because it has ZS and a four character number
                            this.emit("status", `Zone ${cmd.slice(2, 6)}: ${this.decodeSingleZone(cmd.slice(2, 6), siaBlock.data.slice(delimiterPosition + 1, data.length /*- 1*/))}`)
                        } else {
                            console.log("Error got weird zone state")
                        }
                        break
                    default:
                        console.log("Got some other extended cmd response:", cmd.toString())
                }
                break
            case FunctionCodes.reject:
                console.log("Command rejected or bad password")
                break
            case FunctionCodes.alt_acknowledge:
            case FunctionCodes.acknowledge:
            default:
                console.log("Other function code received")
                break
        }
    }

    private doLogin(password: string) {
        let block = new SIABlock(FunctionCodes.remote_login, password)
        let blockToSend = block.toBuffer(true, true)
        this.socket.write(blockToSend)
    }

    private sendAck() {
        let block = new SIABlock(FunctionCodes.acknowledge, "")
        let blockToSend = block.toBuffer(false, false)
        console.log("Ack:", blockToSend)
        this.socket.write(blockToSend)
    }

    private sendAckAndStandby() {
        let block = new SIABlock(FunctionCodes.ack_and_standby, "")
        let blockToSend = block.toBuffer(false, false)
        console.log("Ack and Standby:", blockToSend)
        this.socket.write(blockToSend)
    }

    private sendAltAck() {
        let block = new SIABlock(FunctionCodes.alt_acknowledge, "")
        let blockToSend = block.toBuffer(false, false)
        console.log("Ack:", blockToSend)
        this.socket.write(blockToSend)
    }

    private sendEndOfData() {
        let block = new SIABlock(FunctionCodes.end_of_data, "")
        let blockToSend = block.toBuffer(false, false)
        console.log("End of data:", blockToSend)
        this.socket.write(blockToSend)
    }

    private sendWait() {
        let block = new SIABlock(FunctionCodes.wait, "")
        let blockToSend = block.toBuffer(false, false)
        console.log("Ack and Standby:", blockToSend)
        this.socket.write(blockToSend)
    }

    private sendGetZonesReady() {
        let cmd = "ZS1"
        let block = new SIABlock(FunctionCodes.extended, cmd)
        let blockToSend = block.toBuffer(true, true)
        console.log("Get Zones Ready")
        this.socket.write(blockToSend)
    }

    private sendGetAllZonesOpenState(half: number) {
        let cmd = "ZS20" + half // ZS201 gets Zones 1-256, ZS202 gets Zones 257-512 (see Galaxy::GetAllZonesOpenState at line 842 in Galaxy.cpp)
        let block = new SIABlock(FunctionCodes.extended, cmd)
        let blockToSend = block.toBuffer(true, true)
        console.log("Get All Zones Open State")
        this.socket.write(blockToSend)
    }

    private sendGetEvents() {
        let cmd = "EV"
        let block = new SIABlock(FunctionCodes.extended, cmd.toString())
        let blockToSend = block.toBuffer(true, true)
        console.log("Get Events")
        this.socket.write(blockToSend)
    }

    private sendGetZoneState(zone: number) {
        // TODO: could parse the zone number here
        let cmd = "ZS" + zone
        let block = new SIABlock(FunctionCodes.extended, cmd.toString())
        let blockToSend = block.toBuffer(true, true)
        console.log("Get Zone State")
        this.socket.write(blockToSend)
    }

    private sendDoControl(command: SetCommands) {
        let block = new SIABlock(FunctionCodes.control, `SA*${command}`)
        let blockToSend = block.toBuffer(true, true)
        console.log(`Do Control: ${SetCommands[command]}`)
        this.socket.write(blockToSend)
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
        const activeZones: number[] = []

        // Remove the unused bytes from the string
        zoneData = zoneData.slice(0, 2) + zoneData.slice(4)

        for (let i = 0; i < zoneData.length; i++) {
            const charCode = zoneData.charCodeAt(i)
            const baseZone = 1001 + i * 10
            for (let bit = 0; bit < 8; bit++) {
                if ((charCode & (1 << bit)) !== 0) {
                    activeZones.push(baseZone + bit)
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

    public doCommand(command: SIA4Commands) {
        switch (command) {
            case SIA4Commands.getZoneState:
                this.sendGetZoneState(1021)
                break
            case SIA4Commands.getAllZonesOpenState:
                this.sendGetAllZonesOpenState(1)
                break
            case SIA4Commands.doUnset:
                this.sendDoControl(SetCommands.unset)
                break
            case SIA4Commands.doSet:
                this.sendDoControl(SetCommands.set)
                break
            case SIA4Commands.doPartSet:
                this.sendDoControl(SetCommands.partSet)
                break
            default:
                console.log("Bad command")
        }
    }
}
