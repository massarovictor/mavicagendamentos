
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars manually since we are running via node
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('--- Database Speed Test (All Tables) ---');

    try {
        // Table 1: Usuarios
        let t0 = Date.now();
        const r1 = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
        console.log(`Usuarios: ${r1.count} items (${Date.now() - t0}ms) - Error: ${r1.error?.message}`);

        // Table 2: Espacos
        t0 = Date.now();
        const r2 = await supabase.from('espacos').select('*', { count: 'exact', head: true });
        console.log(`Espacos: ${r2.count} items (${Date.now() - t0}ms) - Error: ${r2.error?.message}`);

        // Table 3: Agendamentos
        t0 = Date.now();
        const r3 = await supabase.from('agendamentos').select('*', { count: 'exact', head: true });
        console.log(`Agendamentos: ${r3.count} items (${Date.now() - t0}ms) - Error: ${r3.error?.message}`);

        // Table 4: Fixos
        t0 = Date.now();
        const r4 = await supabase.from('agendamentos_fixos').select('*', { count: 'exact', head: true });
        console.log(`Fixos: ${r4.count} items (${Date.now() - t0}ms) - Error: ${r4.error?.message}`);

    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

testConnection();
