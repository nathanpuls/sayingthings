// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Authenticate user
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            return new Response("Unauthorized", { status: 401, headers: corsHeaders })
        }

        const { domain } = await req.json()
        if (!domain) {
            return new Response("Missing domain", { status: 400, headers: corsHeaders })
        }

        // 2. Call Cloudflare API to add Custom Hostname
        const cfToken = Deno.env.get('CLOUDFLARE_API_TOKEN')
        const cfZoneId = Deno.env.get('CLOUDFLARE_ZONE_ID')

        const isMisconfigured = !cfToken || !cfZoneId ||
            cfToken === 'your_real_token' || cfZoneId === 'your_real_zone_id' ||
            cfToken === 'your_token_here' || cfZoneId === 'your_zone_id_here';

        if (isMisconfigured) {
            const mockToken = `built-verify-${Math.random().toString(36).substring(7)}`;
            const { error: dbError } = await supabaseClient
                .from('custom_domains')
                .insert({
                    user_id: user.id,
                    domain: domain,
                    verification_token: mockToken,
                    ownership_type: 'txt',
                    ownership_name: `_built-verify.${domain}`,
                    ownership_value: mockToken,
                    verified: false
                })

            if (dbError) throw dbError

            return new Response(JSON.stringify({
                success: true,
                verification_token: mockToken,
                message: "Mock Mode"
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // Real Cloudflare Implementation
        const cfResponse = await fetch(
            `https://api.cloudflare.com/client/v4/zones/${cfZoneId}/custom_hostnames`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${cfToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    hostname: domain,
                    ssl: {
                        method: 'txt',
                        type: 'dv',
                    },
                }),
            }
        )

        const cfData = await cfResponse.json()

        if (!cfData.success) {
            console.error("Cloudflare Error:", cfData.errors)
            return new Response(JSON.stringify({ error: cfData.errors[0]?.message || "Cloudflare Error" }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const hostnameResult = cfData.result

        // Ownership verification
        const ownership = hostnameResult.ownership_verification || {};
        const ownershipType = ownership.type || 'txt';
        const ownershipName = ownership.name || `_cf-custom-hostname.${domain}`;
        const ownershipValue = ownership.value || '';

        // SSL verification
        const sslRecords = hostnameResult.ssl?.validation_records || [];
        const sslName = sslRecords[0]?.txt_name || '';
        const sslValue = sslRecords[0]?.txt_value || '';

        // 3. Insert into Supabase
        const { error: dbError } = await supabaseClient
            .from('custom_domains')
            .insert({
                user_id: user.id,
                domain: domain,
                verification_token: ownershipValue,
                ownership_type: ownershipType,
                ownership_name: ownershipName,
                ownership_value: ownershipValue,
                ssl_name: sslName,
                ssl_value: sslValue,
                verified: false
            })

        if (dbError) {
            if (dbError.code === '23505') {
                return new Response(JSON.stringify({ error: "Domain already registered" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
            throw dbError
        }

        return new Response(JSON.stringify({
            success: true,
            data: hostnameResult
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
