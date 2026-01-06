# Custom Domain Setup Guide

This guide explains how to set up custom domains for your SayingThings platform.

## Overview

Users can connect their own custom domains (e.g., `johndoe.com`) instead of using the default URL structure (`sayingthings.com/u/user-id`).

## Architecture

1. **Database**: Custom domain mappings stored in Supabase `custom_domains` table
2. **Domain Detection**: Automatically detects if a request comes from a custom domain
3. **User Routing**: Maps custom domains to user IDs for content loading
4. **Verification**: DNS-based domain ownership verification

## Setup Steps

### 1. Run the Database Migration

First, apply the custom domains migration to your Supabase database:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL in supabase/migrations/add_custom_domains.sql
# in your Supabase dashboard under SQL Editor
```

### 2. Configure Your Main Domains

Update `/src/lib/domains.js` and add your production domains to the `mainDomains` array:

```javascript
const mainDomains = [
  'localhost',
  'sayingthings.com',
  'www.sayingthings.com',
  'your-vercel-domain.vercel.app',  // Add your deployment domains
];
```

### 3. DNS Configuration (For Users)

When a user wants to connect their custom domain, they need to:

1. **Add a CNAME record** pointing to your main domain:
   ```
   Type: CNAME
   Name: @ (or www)
   Value: sayingthings.com
   ```

2. **Add a TXT record** for verification (generated in admin panel):
   ```
   Type: TXT
   Name: _sayingthings-verify
   Value: sayingthings-verify-abc123xyz (unique token)
   ```

### 4. SSL/HTTPS Setup

For SSL certificates on custom domains, you have several options:

#### Option A: Cloudflare (Recommended - Free)
1. User adds their domain to Cloudflare
2. Cloudflare provides free SSL certificates
3. User points CNAME to your domain through Cloudflare

#### Option B: Vercel Custom Domains
If hosting on Vercel, you can use their custom domain feature:
1. Add domains programmatically via Vercel API
2. Vercel automatically provisions SSL certificates

#### Option C: Let's Encrypt with Caddy/Nginx
Set up a reverse proxy with automatic SSL:
```nginx
# Nginx example with certbot
server {
    server_name ~^(?<domain>.+)$;
    
    location / {
        proxy_pass https://sayingthings.com;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

### 5. Domain Verification Flow

1. User enters their domain in admin panel
2. System generates a verification token
3. User adds TXT record to their DNS
4. System verifies the TXT record exists
5. Domain is marked as verified and becomes active

## Implementation Details

### Database Schema

```sql
custom_domains (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  domain TEXT UNIQUE NOT NULL,
  verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Domain Detection Logic

```javascript
// 1. Check if current hostname is a custom domain
const isCustom = isCustomDomain();

// 2. If custom, look up user ID from database
const userId = await getUserIdFromDomain();

// 3. Load user's content using the userId
```

### Security Considerations

1. **RLS Policies**: Row Level Security ensures users can only manage their own domains
2. **Verification Required**: Domains must be verified before becoming active
3. **Unique Constraint**: Each domain can only be connected to one user
4. **Public Read Access**: Verified domains are publicly readable for routing

## API Endpoints Needed

You'll need to create these serverless functions or API routes:

### 1. Verify Domain Ownership
```javascript
// /api/verify-domain
// Checks if TXT record exists with correct token
```

### 2. Add Domain (Optional - can use Supabase directly)
```javascript
// /api/domains/add
// Adds domain and generates verification token
```

### 3. Remove Domain (Optional - can use Supabase directly)
```javascript
// /api/domains/remove
// Removes domain mapping
```

## Testing Locally

To test custom domains locally:

1. Edit your `/etc/hosts` file:
   ```
   127.0.0.1 testdomain.local
   ```

2. Update `mainDomains` in `domains.js` to exclude `testdomain.local`

3. Add a test record to your database:
   ```sql
   INSERT INTO custom_domains (user_id, domain, verified)
   VALUES ('your-user-id', 'testdomain.local', true);
   ```

4. Visit `http://testdomain.local:5173` (or your dev port)

## Production Deployment

### Vercel
```json
// vercel.json
{
  "rewrites": [
    { "source": "/:path*", "destination": "/index.html" }
  ]
}
```

### Netlify
```toml
# netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Troubleshooting

### Domain not working
- Check DNS propagation (can take up to 48 hours)
- Verify CNAME record is correct
- Ensure domain is marked as `verified` in database

### SSL errors
- Make sure you're using HTTPS
- Check SSL certificate is valid for the custom domain
- Consider using Cloudflare for automatic SSL

### Content not loading
- Check browser console for errors
- Verify user_id is correctly mapped in database
- Ensure RLS policies allow public read access to verified domains

## Future Enhancements

1. **Automatic SSL**: Integrate with Let's Encrypt or Cloudflare API
2. **Subdomain Support**: Allow users to use subdomains
3. **Multiple Domains**: Let users connect multiple domains to one account
4. **Domain Analytics**: Track traffic per custom domain
5. **Email Integration**: Custom email addresses using custom domains
