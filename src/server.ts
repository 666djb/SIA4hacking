import { SIA4 } from "./sia4stuff"

const sia4 = new SIA4()

sia4.on('Event', async function(event: Event) {
    console.log("Received event:", event)
})
