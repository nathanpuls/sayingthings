# Complete CMS Setup Guide

## 🎯 Current Status
Your website has been transformed into a **fully dynamic Content Management System**. Every piece of content on your site can now be edited through the Admin panel at `/admin`.

## 🚨 CRITICAL: Fix Firestore Permissions First

**Why Projects/Studio/Clients/Reviews show "No items found":**
Your Firestore database rules are currently blocking access to these new collections. This is why you see permission errors in the browser console.

### Step-by-Step Fix:

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/
   - Select your project: "sayingthings-5027f"

2. **Update Firestore Rules**
   - Click **"Firestore Database"** in the left sidebar
   - Click the **"Rules"** tab at the top
   - Replace ALL existing rules with this:

```javascript
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

3. **Publish the Rules**
   - Click the blue **"Publish"** button
   - Wait for confirmation

---

## ✅ After Updating Rules: Restore Your Content

Once the Firestore rules are updated:

1. **Go to Admin Panel**
   - Navigate to: http://localhost:5173/admin
   - Sign in with your Google account (natepuls@gmail.com)

2. **Click "Restore Initial" Button**
   - Look in the left sidebar
   - Click the **"Restore Initial"** button (with refresh icon)
   - Confirm when prompted
   - This will populate ALL sections with your original content:
     - ✅ 4 Audio Demos (Commercial, Radio, Narration, Animation)
     - ✅ 4 YouTube Projects
     - ✅ 6 Studio Gear items
     - ✅ 10 Client logos
     - ✅ 5 Reviews
     - ✅ All site settings (hero, about, contact)

3. **Verify Everything Loaded**
   - Click through each tab: Demos, Projects, Studio, Clients, Reviews
   - Each should now show your content
   - If any section is still empty, check the browser console for errors

---

## 📝 What You Can Now Edit

### 1. **Demos Tab** (Audio Samples)
- **Add**: Upload new audio demos with name and URL
- **Edit**: Click the pencil icon to modify name or URL
- **Reorder**: Use up/down arrows to change display order
- **Delete**: Click trash icon to remove

### 2. **Projects Tab** (YouTube Videos)
- **Add**: Enter YouTube video ID (the part after `v=` in the URL)
  - Example: For `https://youtube.com/watch?v=lskrj62JbNI`, use `lskrj62JbNI`
- **Edit**: Modify the YouTube ID
- **Reorder**: Change video display order
- **Delete**: Remove videos

### 3. **Studio Tab** (Equipment)
- **Add**: Equipment name + image URL
- **Edit**: Update name or image
- **Reorder**: Change display order
- **Delete**: Remove items

### 4. **Clients Tab** (Logo Gallery)
- **Add**: Client logo image URL
- **Edit**: Update logo URL
- **Reorder**: Change display order
- **Delete**: Remove logos

### 5. **Reviews Tab** (Testimonials)
- **Add**: Review text + author name
- **Edit**: Modify text or author
- **Reorder**: Change display order
- **Delete**: Remove reviews

### 6. **Site Content Tab** (Global Settings)
Edit ALL text and images on your site:

#### Hero Section
- **Site Name**: Your name in the navigation bar
- **Hero Title**: Main headline (currently "Saying Things")
- **Hero Subtitle**: Tagline below the title

#### About & Images Section
- **About Title**: Opening line of your bio
- **About Text**: Full biography paragraph
- **Profile Image URL**: Main photo in About section
- **Cartoon Profile URL**: Small cartoon in Contact section

#### Contact Info
- **Email Address**: Your contact email
- **Phone Number**: Your contact phone

**Important**: After editing Site Content, click **"Save All Changes"** button at the bottom.

---

## 🔧 Troubleshooting

### "Permission Denied" Errors
- **Cause**: Firestore rules not updated
- **Fix**: Follow the "Fix Firestore Permissions" section above

### "No items found" in Projects/Studio/Clients/Reviews
- **Cause**: Database is empty OR permission errors
- **Fix**: 
  1. Update Firestore rules first
  2. Click "Restore Initial" in sidebar
  3. Refresh the page

### Changes Not Saving
- **Cause**: Permission errors or not clicking Save
- **Fix**: 
  1. Check browser console for errors
  2. Ensure Firestore rules are updated
  3. For Site Content tab, click "Save All Changes" button

### Images Not Displaying
- **Cause**: Incorrect image URLs
- **Fix**: 
  - Images should be in `/public` folder
  - Use relative paths like `images/profile.jpeg`
  - Or use full URLs like `https://...`

---

## 📁 File Structure Reference

Your editable content is stored in Firestore collections:

```
Firestore Database
├── demos/          → Audio demo tracks
├── videos/         → YouTube project IDs
├── studio/         → Studio equipment
├── clients/        → Client logo URLs
├── reviews/        → Customer testimonials
└── settings/
    └── siteContent → All text, name, and image URLs
```

---

## 🚀 Next Steps

1. ✅ Update Firestore rules (see above)
2. ✅ Click "Restore Initial" to populate content
3. ✅ Test editing each section
4. ✅ Customize your content through the Admin panel
5. ✅ Deploy your changes (run `./deploy.sh` when ready)

---

## 📞 Quick Reference

- **Admin Panel**: http://localhost:5173/admin
- **Live Site**: http://localhost:5173/
- **Firebase Console**: https://console.firebase.google.com/
- **Your Email**: natepuls@gmail.com (only this email has admin access)

---

## 💡 Pro Tips

1. **Always test locally first**: Make changes at localhost before deploying
2. **Use "Restore Initial" carefully**: It will overwrite your current content
3. **Keep image URLs organized**: Store images in `/public/images/` folder
4. **Check browser console**: If something doesn't work, open DevTools (F12) and check for errors
5. **Backup your content**: Export your Firestore data periodically from Firebase Console

---

**Need Help?** Check the browser console (F12) for detailed error messages.
