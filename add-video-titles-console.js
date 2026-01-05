// PASTE THIS IN THE BROWSER CONSOLE ON THE ADMIN PAGE
// This will add titles to your existing videos

const videoTitles = {
    "lskrj62JbNI": "Freeletics Commercial",
    "C-GdK49QZVs": "Getinge Medical",
    "QVTGS9ZAk60": "Florida State Parks",
    "friJGg6UDvo": "FarmersOnly.com"
};

// Get Firestore from the global window object (already loaded by your app)
const { collection, getDocs, updateDoc, doc } = window.firebase.firestore;
const db = window.db; // Your app should expose this

async function addTitlesToVideos() {
    console.log('🔄 Adding titles to existing videos...');

    try {
        const videosSnapshot = await getDocs(collection(db, 'videos'));
        let updated = 0;

        for (const videoDoc of videosSnapshot.docs) {
            const data = videoDoc.data();
            const title = videoTitles[data.youtubeId];

            if (title && !data.title) {
                await updateDoc(doc(db, 'videos', videoDoc.id), { title });
                console.log(`✅ Added title "${title}" to video ${data.youtubeId}`);
                updated++;
            } else if (data.title) {
                console.log(`⏭️  Video ${data.youtubeId} already has title: "${data.title}"`);
            }
        }

        console.log(`✅ Done! Updated ${updated} videos`);
        alert(`✅ Successfully added titles to ${updated} videos!\n\nRefresh the page to see the changes.`);
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error: ' + error.message);
    }
}

// Run it
addTitlesToVideos();
