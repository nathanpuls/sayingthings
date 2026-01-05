// Quick Firestore Test Script
// Run this in the browser console to test if Firestore permissions are working

import { db } from './lib/firebase.js';
import { collection, addDoc } from 'firebase/firestore';

async function testFirestorePermissions() {
    console.log('🧪 Testing Firestore permissions...');

    const tests = [
        { collection: 'videos', data: { youtubeId: 'TEST123', order: 0 } },
        { collection: 'studio', data: { name: 'Test Gear', url: 'test.jpg', order: 0 } },
        { collection: 'clients', data: { url: 'test-logo.jpg', order: 0 } },
        { collection: 'reviews', data: { text: 'Test review', author: 'Test Author', order: 0 } },
    ];

    for (const test of tests) {
        try {
            await addDoc(collection(db, test.collection), test.data);
            console.log(`✅ ${test.collection}: SUCCESS`);
        } catch (error) {
            console.error(`❌ ${test.collection}: FAILED`, error.code, error.message);
        }
    }

    console.log('🧪 Test complete! Check Firestore Database in Firebase Console.');
}

// Run the test
testFirestorePermissions();
