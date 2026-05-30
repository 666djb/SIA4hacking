import fs from 'fs'

export interface Config {
    host: string
    port: number
    password: string
    zones: [ZoneConfig]
}

// export interface MqttConfig {
//     brokerUrl: string
//     baseTopic: string
//     username: string
//     password: string
//     discoveryTopic: string
// }

export interface ZoneConfig {
    zone: string
}

export function getConfig(configFile: string): Config {
    return JSON.parse(fs.readFileSync(configFile, "utf8")) as Config
}
