# SIA4 proof of concept
## Background
A lot of SIA4 understanding has been derived from the OpenGalaxy project and I've been playing with code to do similar things using Typescript for Node.js.

## Status
This code demonstrates that is possible to poll the SIA4 alarm panel for open zones and retrieve useful information. 

## Use
Configure alarm pannel hostname/IP, port number and remote PIN by creating a file called config.json. A sample is included named sample-config.json.

Build with: npm install

Run with: npm start

Use the menu to test the proof of concept.

## Next
I am going to test the set/unset etc. functionality and then turn this code into a MQTT client application for integration into Home Assistant.