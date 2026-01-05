// Quick script to add titles to existing videos
// Run this in the browser console on the admin page

const videoTitles = {
    "lskrj62JbNI": "Freeletics Commercial",
    "C-GdK49QZVs": "Getinge Medical",
    "QVTGS9ZAk60": "Florida State Parks",
    "friJGg6UDvo": "FarmersOnly.com"
};

async function addTitlesToVideos() {
    const { collection, getDocs, updateDoc, doc } = await import('firebase/firestore');
    const { db } = await import('./src/lib/firebase.js');

    console.log('🔄 Adding titles to existing videos...');

    const videosSnapshot = await getDocs(collection(db, 'videos'));
    let updated = 0;

    for (const videoDoc of videosSnapshot.docs) {
        const data = videoDoc.data();
        const title = videoTitles[data.youtubeId];

        if (title && !data.title) {
            await updateDoc(doc(db, 'videos', videoDoc.id), { title });
            console.log(`✅ Added title "${title}" to video ${data.youtubeId}`);
            updated++;
        }
    }

    console.log(`✅ Done! Updated ${updated} videos`);
    alert(`✅ Successfully added titles to ${updated} videos!\n\nRefresh the page to see the changes.`);
}

// Run it
addTitlesToVideos().catch(err => {
    console.error('❌ Error:', err);
    alert('Error: ' + err.message);
});
