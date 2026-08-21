const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdmin() {
  console.log('Seeding admin account...');

  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@mcdaves.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: { role: 'admin' },
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Admin account already exists.');
    } else {
      console.error('Error creating admin:', error);
    }
  } else {
    console.log('Successfully created admin account:', data.user.id);
  }
}

seedAdmin();
