const fs = require('fs');

const file = 'd:/Workspace/Itqan Upgrade/lib/i18n/locales/en.ts';
let content = fs.readFileSync(file, 'utf8');

// The error is TS1117: An object literal cannot have multiple properties with the same name.
// Let's just find and remove the second occurrence of " في مسابقة: "

let firstIndex = content.indexOf('" في مسابقة: "');
let secondIndex = content.indexOf('" في مسابقة: "', firstIndex + 1);

if (secondIndex !== -1) {
    let before = content.substring(0, secondIndex);
    let after = content.substring(secondIndex);
    let endOfLine = after.indexOf('\\n');
    content = before + after.substring(endOfLine + 1);
    fs.writeFileSync(file, content);
    console.log("Removed second occurrence of ' في مسابقة: '");
} else {
    console.log("Could not find second occurrence.");
}

// Check for any other duplicates just in case
let keys = new Set();
let lines = content.split('\\n');
let modified = false;
for (let i=0; i<lines.length; i++) {
    let match = lines[i].match(/^\\s*"((?:[^"\\\\]|\\\\.)*)":/);
    if (match) {
        if (keys.has(match[1])) {
            console.log("Found duplicate key:", match[1]);
            lines[i] = "";
            modified = true;
        } else {
            keys.add(match[1]);
        }
    }
}

if (modified) {
    fs.writeFileSync(file, lines.filter(l => l !== "").join('\\n'));
    console.log("Removed other duplicates.");
}

