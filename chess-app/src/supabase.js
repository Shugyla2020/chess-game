import { createClient } from '@supabase/supabase-js';


const supabaseUrl = 'https://vbiociglvjzyxvjaflod.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiaW9jaWdsdmp6eXh2amFmbG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3Mzc2ODYsImV4cCI6MjA5MzMxMzY4Nn0.y2fzeS5cK9WeQJzy5bK2zG_NfxbnKFP8syctMStBx8g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);