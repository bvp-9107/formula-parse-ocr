import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dhxkmwncqkywncdykavf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoeGttd25jcWt5d25jZHlrYXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNjQwNTIsImV4cCI6MjEwNzk0MDA1Mn0.AaP1tXd3kn-iH44Ag5xU_s0J-XLFmA1QOo_WZfSgrkQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
