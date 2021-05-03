# SIA4 stuff
## Background
A lot of SIA4 understanding has been derived from the OpenGalaxy project and I've been playing with code to do similar things using Typescript for Node.js. Ultimate aim is to be able to decode Zone events whether the panel is set or unset.
## Status
As published here, this code connects to the panel, logs in and retrieves data about open zones, displaying in raw buffer format on the console. The changes in the displayed data correspond to opened zones as seen by the panel, but some decoding is necessary to match the buffer contents to the actual zone numbers.

Play around with sia4stuff.ts to make changes in terms of commands sent etc. Several of the functions in the SIA4 class are not used (but could be tested and used) - these are to send other commands.
## Use
Configure alarm pannel hostname/IP and remote PIN by editing constants at top of sia4stuff.ts

Build with: npm install

Run with: npm start

Stop with Control-c
## Observations
Currently the code works like this:
* Connect to alarm panel
* Send login information
* Receive a configuration message
* Send the sendGetAllZonesOpenState message
* Receive a response (showing the open zones)
* The alarm panel then closes the connection
* Then we go back to connect

It seems to be wrong that it is necessary to log in for each poll of data. Is there something else that needs to be done/sent to keep the connection alive? I can understand the need to send the sendGetAllZonesOpenState message periodically.

David