// Script to generate the correct Secret Manager value for FIREBASE_ADMIN_PRIVATE_KEY
// Run: node generate-secret-value.js
// Then copy the output and paste it into Secret Manager

const fs = require('fs');
const keyFile = JSON.parse(fs.readFileSync('./gr7-system-firebase-adminsdk-fbsvc-06eb3751c9.json', 'utf8'));

console.log('=== COPY EVERYTHING BELOW THIS LINE (for Secret Manager) ===');
console.log(keyFile.private_key);
console.log('=== COPY EVERYTHING ABOVE THIS LINE ===');
console.log('');
console.log('Key length:', keyFile.private_key.length);
console.log('Starts with:', keyFile.private_key.substring(0, 30));
console.log('Contains real newlines:', keyFile.private_key.includes('\n'));
