# Quick Start: Setting Up sayingthings.com as Your Main Domain

This guide will help you set up `sayingthings.com` as your main custom domain instead of using the `/u/user-id` URL structure.

## Current Situation
- Your site: `https://sayingthings.com/u/adbdc0ad-87a8-4e1d-b7f5-eb2d17c95f59`
- Goal: `https://sayingthings.com`

## Steps to Implement

### 1. Apply Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy the contents of supabase/migrations/add_custom_domains.sql
-- and run it in your Supabase dashboard
```

### 2. Add Your Domain to the Database

In Supabase SQL Editor, run:

```sql
INSERT INTO custom_domains (user_id, domain, verified)
VALUES (
  'adbdc0ad-87a8-4e1d-b7f5-eb2d17c95f59',  -- Your user ID
  'sayingthings.com',
  true  -- Mark as verified since you own it
);
```

### 3. Update Your Routing

The code has already been updated to support this! The Home component now:
1. Checks if you're on a custom domain
2. Looks up the user ID from the domain
3. Loads your content automatically

### 4. Deploy Your Changes

```bash
# Commit and push
git add .
git commit -m "Add custom domain support"
git push

# Deploy to your hosting platform (Vercel/Netlify)
```

### 5. Update Your DNS (if needed)

If you're hosting on a platform like Vercel:

1. **Add Custom Domain in Vercel Dashboard**:
   - Go to your project settings
   - Add `sayingthings.com` as a custom domain
   - Vercel will provide DNS instructions

2. **Update DNS Records**:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel's IP - check their docs)
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### 6. Test It

1. Visit `https://sayingthings.com`
2. Your content should load automatically!
3. The `/u/user-id` URLs will still work for other users

## How It Works

```javascript
// When someone visits sayingthings.com:

1. App checks: "Is this a custom domain?"
   → Yes, it's not in the mainDomains list

2. App queries database:
   → "SELECT user_id FROM custom_domains WHERE domain = 'sayingthings.com'"
   → Returns: 'adbdc0ad-87a8-4e1d-b7f5-eb2d17c95f59'

3. App loads your content using that user_id
   → Same as visiting /u/adbdc0ad-87a8-4e1d-b7f5-eb2d17c95f59
```

## Important Notes

### For Your Main Domain
Since `sayingthings.com` is YOUR platform's main domain, you need to:

1. **Update `src/lib/domains.js`**:
   ```javascript
   const mainDomains = [
     'localhost',
     // Remove 'sayingthings.com' from this list if you want it to work as a custom domain
     // OR keep it here and use a subdomain like 'app.sayingthings.com' for the platform
   ];
   ```

2. **Consider Using a Subdomain for the Platform**:
   - Platform: `app.sayingthings.com/u/:uid`
   - Your site: `sayingthings.com`
   - Other users: `theirname.com` (their custom domains)

### Recommended Architecture

```
sayingthings.com           → Your personal site (custom domain)
app.sayingthings.com       → Platform for all users
app.sayingthings.com/u/:id → Individual user pages
johndoe.com                → Another user's custom domain
```

## Alternative: Root Domain for Your Site

If you want `sayingthings.com` to be YOUR site:

### Option 1: Use App Subdomain (Recommended)
```javascript
// In src/lib/domains.js
const mainDomains = [
  'localhost',
  'app.sayingthings.com',  // Platform lives here
  // sayingthings.com is NOT in this list, so it's treated as custom
];
```

Then update your routes:
- Platform: `app.sayingthings.com`
- Your site: `sayingthings.com`

### Option 2: Special Case for Root Domain
```javascript
// In src/lib/domains.js
export async function getUserIdFromDomain() {
  const hostname = window.location.hostname;
  
  // Special case: root domain without /u/ path = your site
  if (hostname === 'sayingthings.com' && !window.location.pathname.startsWith('/u/')) {
    return 'adbdc0ad-87a8-4e1d-b7f5-eb2d17c95f59'; // Your user ID
  }
  
  // ... rest of the logic
}
```

## Next Steps

1. ✅ Database migration applied
2. ✅ Code updated to support custom domains
3. ⏳ Decide on architecture (subdomain vs root)
4. ⏳ Update DNS settings
5. ⏳ Deploy and test

## Questions?

- **Q: Will /u/:uid URLs still work?**
  - A: Yes! They'll continue to work for all users

- **Q: Can other users add custom domains?**
  - A: Yes, you'll need to add a UI in the admin panel for them to manage domains

- **Q: What about SSL?**
  - A: If using Vercel/Netlify, SSL is automatic. Otherwise, see CUSTOM_DOMAINS.md

- **Q: How do I add a domain management UI?**
  - A: See the next section for admin panel integration
