
console.log("\n--- Testing mapByteToZone (Numbers) ---");
[1, 2, 4, 8, 16, 32, 64, 128, 0, 255].forEach(val => {
    console.log(`Input: ${val} (${val.toString(2).padStart(8, '0')}) -> Zone: ${mapByteToZone(val)}`);
});
console.log("---------------------------------------\n");

console.log("--- Testing mapByteToZone (Strings) ---");
const testStrings = [
    String.fromCharCode(1),              // Should map to [1001]
    String.fromCharCode(0, 1),           // Should map to [1011]
    String.fromCharCode(5, 128),         // Should map to [1001, 1003, 1018]
    String.fromCharCode(255, 0, 255),    // Should map to [1001..1008, 1021..1028]
];
testStrings.forEach((str, idx) => {
    const hexRep = [...str].map(c => "0x" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")).join(", ");
    console.log(`Test ${idx + 1} (Bytes: [${hexRep}]) -> Active Zones:`, mapByteToZone(str));
});
console.log("---------------------------------------\n");


/**
 * Maps either a single byte number (0-255) to a zone (1011-1018),
 * or a string of characters representing multiple bytes to an array of active zones.
 * 
 * For strings:
 * - 1st byte (index 0) represents zones 1001-1008
 * - 2nd byte (index 1) represents zones 1011-1018
 * - 3rd byte (index 2) represents zones 1021-1028
 * - ... and so on (1001 + index * 10 to 1008 + index * 10)
 * 
 * @param {number|string} input - The byte number or the string.
 * @returns {number|number[]|null} For numbers: a single zone number or null. For strings: an array of active zone numbers.
 */
function mapByteToZone(input) {
    if (typeof input === 'number') {
        if (input <= 0 || input > 255) {
            return null;
        }
        const bitIndex = Math.log2(input);
        if (Number.isInteger(bitIndex)) {
            // Backward compatibility: 1 maps to 1011 (i.e. second byte LSB)
            return 1011 + bitIndex;
        }
        return null;
    }

    if (typeof input === 'string') {
        const activeZones = [];
        for (let i = 0; i < input.length; i++) {
            const charCode = input.charCodeAt(i);
            const baseZone = 1001 + i * 10;
            for (let bit = 0; bit < 8; bit++) {
                if ((charCode & (1 << bit)) !== 0) {
                    activeZones.push(baseZone + bit);
                }
            }
        }
        return activeZones;
    }

    return null;
}
