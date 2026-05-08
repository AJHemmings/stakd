const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function applyMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Applying migration...');
  const { error } = await supabase.rpc('run_sql', {
    sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;'
  });

  if (error) {
    console.error('Error applying migration:', error);
    if (error.message.includes('function "run_sql" does not exist')) {
      console.log('Note: "run_sql" function is not enabled by default in Supabase. You need to enable it in the SQL Editor or run the SQL directly.');
    }
  } else {
    console.log('Migration applied successfully!');
  }
}

applyMigration();
