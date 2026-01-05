# Firebase Setup
To enable the Admin features (adding/editing/deleting demos), you need to set up a free Firebase project.

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. **Enable Authentication**:
   - Go to "Authentication" -> "Sign-in method".
   - Enable **Google**.
3. **Enable Firestore Database**:
   - Go to "Firestore Database" -> "Create database".
   - Start in **Production mode**.
   - Go to the "Rules" tab and paste this logic to allow read for everyone but write only for you. This covers all collections like demos, projects, studio, etc.:
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /{document=**} {
           allow read: if true;
           allow write: if request.auth != null && request.auth.token.email == "natepuls@gmail.com";
         }
       }
     }
     ```
     *(Replace `natepuls@gmail.com` with your actual email if different)*
6. **Enable Storage**:
   - Go to "Storage" in the left sidebar.
   - Click "Get started".
   - Start in **Production mode**.
   - Go to "Rules" tab and paste this:
     ```
     rules_version = '2';
     service firebase.storage {
       match /b/{bucket}/o {
         match /vo-audio/{allPaths=**} {
           allow read: if true;
           allow write: if request.auth != null && request.auth.token.email == "natepuls@gmail.com";
         }
       }
     }
     ```

7. **Verify**:
   - Go to `/admin` and try adding a demo by uploading a file.

## Fix CORS Error (If Upload Fails)
If you see a "CORS" error when uploading, you need to configure your bucket to accept uploads from your website.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and select your project ("Saying Things").
2. Click the **Activate Cloud Shell** button (terminal icon) in the top right.
3. In the terminal that appears at the bottom, create a configuration file:
   ```bash
   cat > cors.json <<EOF
   [
     {
       "origin": ["*"],
       "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
       "responseHeader": ["Content-Type", "x-goog-resumable"],
       "maxAgeSeconds": 3600
     }
   ]
   EOF
   ```
4. Apply it to your bucket:
   - Run this command in the Cloud Shell:
     ```bash
     gsutil cors set cors.json gs://sayingthings-5027f.firebasestorage.app
     ```
4. **Get Config Keys**:
   - Go to Project Settings (gear icon).
   - Scroll down to "Your apps" -> Select Web (</> icon).
   - Register app (name it "Saying Things").
   - Copy the `firebaseConfig` object (apiKey, authDomain, etc).
5. Open `src/lib/firebase.js` in this project and paste your keys there.

Once done, go to `/admin` on your website to manage your demos!
