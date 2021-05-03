import { Socket } from 'net'
import { SIABlock } from "./siaBlock"
import { FunctionCodes } from "./functionCodes"
import * as events from "events"

const ALARMHOST = "192.168.0.1" // IP or hostname of Flex alarm panel
const PASSWORD = "543210" // Remote user password (I think this is the default)

export class SIA4 extends events.EventEmitter {
    constructor() {
        super()
        let socket = new Socket()
        
        socket.on("data", (data: Buffer) => {
            //console.log("Received data:", data)
            //console.log("data[1]: %u", data[1])
            //console.log("FnCodes.configuration: %u", FunctionCodes.configuration)

            // Respond if necessary
            switch (data[1]){
                case FunctionCodes.configuration:
                    //console.log("Got configuration message")
                    this.sendGetAllZonesOpenState(socket)
                    //this.sendGetZonesReady(socket)
                    //this.sendGetEvents(socket)
                    //this.sendGetZoneState(socket)
                    break
                case FunctionCodes.extended:
                    let zones=data.slice(8,data.length-1)
                    console.log("Open Zones:", zones)
                case FunctionCodes.alt_acknowledge:
                case FunctionCodes.acknowledge:
                default:
                    break
            }
            
        })

        socket.on("close", () => {
            //console.log("socket closed")
            setTimeout( ()=>{
                this.connect(socket)
            },5000)
        })

        socket.on("connect", () => {
            //console.log("Connected to socket")
        })

        this.connect(socket)
    }

    connect(socket: Socket) {
        socket.connect(10005, ALARMHOST, () => {
            //console.log("Connected to remote")
            this.doLogin(socket)
        })
    }

    doLogin(socket: Socket) {
        //console.log("Doing login")
        let block = new SIABlock(FunctionCodes.remote_login, PASSWORD)
        let blockToSend = block.toBuffer(true,true)
        //console.log("Remote login:", blockToSend)
        socket.write(blockToSend)
    }

    sendConfig(socket: Socket) {
        let block = new SIABlock(FunctionCodes.configuration, "AL4B1")
        let blockToSend = block.toBuffer(true,true)
        console.log("Configuration:", blockToSend)
        socket.write(blockToSend)
    }

    sendAck(socket: Socket) {
        let block = new SIABlock(FunctionCodes.acknowledge, "")
        let blockToSend = block.toBuffer(false,false)
        console.log("Ack:", blockToSend)
        socket.write(blockToSend)
    }

    sendGetZonesReady(socket: Socket) {
        let cmd = "ZS1"
        let block = new SIABlock(FunctionCodes.extended, cmd)
        let blockToSend = block.toBuffer(true,true)
        console.log("Get Zones Ready:", blockToSend)
        socket.write(blockToSend)
    }

    sendGetAllZonesOpenState(socket: Socket) {
        let cmd = "ZS201"
        let block = new SIABlock(FunctionCodes.extended, cmd)
        let blockToSend = block.toBuffer(true,true)
        //console.log("Get All Zones Open State:", blockToSend)
        socket.write(blockToSend)
    }

    sendGetEvents(socket: Socket) {
        let cmd = Buffer.alloc(16)
        cmd.write("EV")
        let block = new SIABlock(FunctionCodes.extended, cmd.toString())
        let blockToSend = block.toBuffer(true,true)
        //console.log("Get Zones Open State:", blockToSend)
        socket.write(blockToSend)
    }

    sendGetZoneState(socket: Socket) {
        let cmd = Buffer.alloc(6)
        cmd.write("ZS1021")
        let block = new SIABlock(FunctionCodes.extended, cmd.toString())
        let blockToSend = block.toBuffer(true,true)
        console.log("Get Zone State:", blockToSend)
        socket.write(blockToSend)
    }

}
