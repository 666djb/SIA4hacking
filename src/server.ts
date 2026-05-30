import { SIA4 } from "./sia4Connection"
import * as readline from "readline"
import { SIA4Commands } from "./sia4Commands"
import { getConfig, Config } from "./config"

const CONFIG_FILE = "config.json"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

function prompt(query: string): Promise<string> {
    return new Promise((resolve) => rl.question(query, resolve))
}

async function doMenu(sia4: SIA4): Promise<boolean> {
    let exitMenu = false

    while (!exitMenu) {
        console.log("\n==============================")
        console.log("     SIA4 ALARM SYSTEM MENU")
        console.log("==============================")
        console.log("1. Get Zone 1021 State")
        console.log("2. Get All Zones Open State")
        console.log("3. Do Unset")
        console.log("4. Do Set")
        console.log("5. Do Part Set")
        console.log("6. Exit")
        console.log("==============================")

        const choice = await prompt("Select an option (1-6): ")

        console.log("\n")

        switch (choice.trim()) {
            case "1":
                sia4.doCommand(SIA4Commands.getZoneState)
                exitMenu = true
                break
            case "2":
                sia4.doCommand(SIA4Commands.getAllZonesOpenState)
                exitMenu = true
                break
            case "3":
                sia4.doCommand(SIA4Commands.doUnset)
                exitMenu = true
                break
            case "4":
                sia4.doCommand(SIA4Commands.doSet)
                exitMenu = true
                break
            case "5":
                sia4.doCommand(SIA4Commands.doPartSet)
                exitMenu = true
                break
            case "6":
                console.log("Exiting...")
                return false
            default:
                console.log("Invalid option, please choose 1-6.")
                break
        }
    }

    return true
}

async function main() {
    let config: Config

    try {
        config = getConfig(CONFIG_FILE)
    } catch (e) {
        console.error("Error loading configuration:", e.message)
        console.log(`Did you create a ${CONFIG_FILE} file?`)
        process.exit(1)
    }

    const sia4 = new SIA4(config.host, config.port, config.password)

    sia4
        .on('ready', async () => {
            //console.log("Ready to receive commands")
            if (!await doMenu(sia4)) {
                sia4.close()
                process.exit()
            }
        })
        .on('status', (status: string) => {
            console.log(status)
        })
        .on('zonesOpen', (status: number[] | null) => {
            if (status) {
                console.log("Zones Open:")
                for (let i = 0; i < status.length; i++) {
                    console.log(`${status[i].toString()} - ${config.zones[status[i]]}`)
                    //console.log(`${config.zones[status[i]]}`)
                }
            } else {
                console.log("All Zones Closed")
            }
        })
        .on('close', () => {
            //console.log("Connection closed")
            sia4.connect()
        })

    sia4.connect()
}

main().catch(err => {
    console.error("An error occurred:", err)
    rl.close()
})
