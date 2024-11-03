import { SIA4, Commands } from "./sia4stuff"

// TODO: this is just for testing

//let command=Commands.getAllZonesOpenState
//let command=Commands.doUnset
let command=Commands.getZoneState

console.log(`Running commmand: ${command}`)
const sia4 = new SIA4(command)

sia4.on('status', async function(status: string) {
    console.log("Received status:", status)
})
