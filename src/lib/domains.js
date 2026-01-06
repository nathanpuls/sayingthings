import { supabase } from './supabase';

/**
 * Get the user ID based on the current domain
 * @returns {Promise<string|null>} User ID or null
 */
export async function getUserIdFromDomain() {
    const hostname = window.location.hostname;

    // List of your main domains (add your production domain here)
    const mainDomains = [
        'localhost',
        'sayingthings.com',
        'www.sayingthings.com',
        // Add your Vercel/Netlify domains here
    ];

    // If on main domain, return null (will use URL-based routing)
    if (mainDomains.some(domain => hostname.includes(domain))) {
        return null;
    }

    // Check if this is a custom domain
    try {
        const { data, error } = await supabase
            .from('custom_domains')
            .select('user_id')
            .eq('domain', hostname)
            .eq('verified', true)
            .single();

        if (error) {
            console.error('Error fetching custom domain:', error);
            return null;
        }

        return data?.user_id || null;
    } catch (err) {
        console.error('Error in getUserIdFromDomain:', err);
        return null;
    }
}

/**
 * Check if the current domain is a custom domain
 * @returns {boolean}
 */
export function isCustomDomain() {
    const hostname = window.location.hostname;
    const mainDomains = [
        'localhost',
        'sayingthings.com',
        'www.sayingthings.com',
    ];

    return !mainDomains.some(domain => hostname.includes(domain));
}

/**
 * Generate a verification token for domain ownership
 * @returns {string}
 */
export function generateVerificationToken() {
    return `sayingthings-verify-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Verify domain ownership via DNS TXT record
 * @param {string} domain - Domain to verify
 * @param {string} token - Verification token
 * @returns {Promise<boolean>}
 */
export async function verifyDomainOwnership(domain, token) {
    try {
        // In production, you'd call a backend API that checks DNS records
        // For now, we'll do a simple check
        // You'll need to implement a serverless function or backend endpoint for this

        const response = await fetch(`/api/verify-domain?domain=${domain}&token=${token}`);
        const result = await response.json();
        return result.verified;
    } catch (err) {
        console.error('Error verifying domain:', err);
        return false;
    }
}

/**
 * Add a custom domain for the current user
 * @param {string} domain - Domain to add
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export async function addCustomDomain(domain) {
    try {
        // Clean the domain
        const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/$/, '');

        // Generate verification token
        const verificationToken = generateVerificationToken();

        const { data, error } = await supabase
            .from('custom_domains')
            .insert([{
                domain: cleanDomain,
                verification_token: verificationToken,
                verified: false
            }])
            .select()
            .single();

        if (error) {
            return { success: false, error };
        }

        return { success: true, data };
    } catch (err) {
        return { success: false, error: err };
    }
}

/**
 * Remove a custom domain
 * @param {string} domainId - Domain ID to remove
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export async function removeCustomDomain(domainId) {
    try {
        const { error } = await supabase
            .from('custom_domains')
            .delete()
            .eq('id', domainId);

        if (error) {
            return { success: false, error };
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: err };
    }
}

/**
 * Get all custom domains for the current user
 * @returns {Promise<Array>}
 */
export async function getUserCustomDomains() {
    try {
        const { data, error } = await supabase
            .from('custom_domains')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching custom domains:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('Error in getUserCustomDomains:', err);
        return [];
    }
}
