import { createClient } from '@supabase/supabase-js';

export function isConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let client;
// Faqat serverda ishlatiladi (service_role kaliti brauzerga chiqmaydi)
export function db() {
  if (!isConfigured()) throw new Error("Supabase sozlanmagan: .env.local faylini to'ldiring");
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
}
