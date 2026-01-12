
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
const envLocal = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
const envVars = Object.fromEntries(
    envLocal.split('\n').filter(Boolean).map(line => line.split('='))
);

const supabase = createClient(
    envVars['VITE_SUPABASE_URL'],
    envVars['VITE_SUPABASE_ANON_KEY']
);

async function main() {
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('username, full_name, bio, location, website');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    console.log('Profiles found:', profiles);
}

main();
