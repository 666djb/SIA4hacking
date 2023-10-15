import { FunctionCodes } from "./functionCodes"

const BASE_PARITY = 0xFF
const HEADER_LENGTH = 2
const PACKING_LENGTH = HEADER_LENGTH + 1
const ACK_REQUEST = 0x40
const REVERSE_CHANNEL_ENABLE = 0x80

export class SIABlock {

    constructor(public funcCode: FunctionCodes, public data: string) {
    }

    /*
        union HeaderByte {
            unsigned char data;
            struct {
                unsigned char block_length :6;
                unsigned char acknoledge_request :1;
                unsigned char reverse_channel_enable :1;
            };
        };
    */

    toBuffer(ack: boolean, header: boolean) {
        const dataLength = this.data.length
        let bufferLength = dataLength + PACKING_LENGTH
        
        let headerByte

        // Ack Request should be 1 for ack==true, 0 for ack==false||header==false
        // Reverse chan should be 1 for header==true, 0 for header==false

        if(ack===true){
            headerByte = dataLength + ACK_REQUEST + REVERSE_CHANNEL_ENABLE
        }else{
            headerByte = dataLength + REVERSE_CHANNEL_ENABLE
        }

        if(header===false){ // If no header, then header byte is 0
            headerByte = 0x00
        }
        
        let buffer = Buffer.alloc(bufferLength)

        buffer.writeUInt8(headerByte, 0)
        buffer.writeUInt8(this.funcCode, 1)

        let parity = BASE_PARITY
        parity ^= headerByte
        parity ^= this.funcCode

        this.data.split('').forEach((char, index) => {
            buffer.write(char, index + HEADER_LENGTH)
            parity ^= buffer[index + HEADER_LENGTH]
        })

        buffer[bufferLength - 1] = parity

        return buffer
    }

    static fromBuffer(buffer: Buffer) {

        const dataLength = this.checkParity(buffer)
        const funcCode = buffer[1]
        const data = buffer.toString('utf8', HEADER_LENGTH, HEADER_LENGTH + dataLength)

        return new SIABlock(funcCode, data)
    }

    static checkParity(buffer: Buffer) {

        let dataLength = buffer[0] - ACK_REQUEST
        let parity = BASE_PARITY
        let bufferLength = dataLength + PACKING_LENGTH

        for (let i = 0; i < bufferLength; i++) {
            parity ^= buffer[i]
        }

        if (parity != 0) {
            throw "Parity Error"
        }

        return dataLength
    }
}
