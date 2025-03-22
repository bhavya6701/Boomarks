import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { SUPABASE_EXTENSION_PASSWORD, SUPABASE_URL, SUPABASE_ANON_KEY, } from './config.js';


export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            storage: {
                getItem: async (key) => (await browser.storage.local.get(key))[key],
                setItem: async (key, value) => await browser.storage.local.set({ [key]: value }),
                removeItem: async (key) => await browser.storage.local.remove(key)
            }
        }
    }
)