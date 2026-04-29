const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// The path to your service account key file
const serviceAccount = require(path.join(__dirname, '../../serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log('✅ Firebase Admin Initialized');

module.exports = admin;
