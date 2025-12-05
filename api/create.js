// api/create.js - UPDATED VERSION
import { createClient } from '@supabase/supabase-js'
import { customAlphabet } from 'nanoid'

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    // Debug log
    console.log('API called with body:', req.body);
    
    // Get environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    
    console.log('Supabase URL exists:', !!supabaseUrl);
    console.log('Supabase Key exists:', !!supabaseKey);
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Missing Supabase credentials' 
      });
    }
    
    // Create Supabase client directly
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get request data
    const { target, alias, mode = 'burst-5' } = req.body;
    
    if (!target || !target.startsWith('http')) {
      return res.status(400).json({ error: 'Valid URL required (start with http:// or https://)' });
    }
    
    // Generate IDs
    const nanoid = customAlphabet(alphabet, 10);
    const id = alias ? 
      alias.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase() : 
      nanoid();
    
    const secretKey = nanoid(32);
    
    console.log('Generated ID:', id);
    
    // Check if ID exists
    const { data: existing, error: checkError } = await supabase
      .from('links')
      .select('id')
      .eq('id', id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Check error:', checkError);
      return res.status(500).json({ error: 'Database check failed' });
    }
    
    if (existing) {
      return res.status(400).json({ error: 'This alias already exists. Try a different name.' });
    }
    
    // Insert into database
    const { error: insertError } = await supabase
      .from('links')
      .insert({
        id,
        secret_key: secretKey,
        target_url: target,
        capture_mode: mode,
        alias: alias || null,
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ 
        error: 'Failed to save link',
        details: insertError.message 
      });
    }
    
    console.log('Link created successfully:', id);
    
    // Success response
    return res.status(200).json({
      success: true,
      id,
      key: secretKey,
      target,
      mode,
      link: `${req.headers.origin || 'https://hjh-official.vercel.app'}/${id}`,
      message: 'Link created successfully!'
    });
    
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
        }
