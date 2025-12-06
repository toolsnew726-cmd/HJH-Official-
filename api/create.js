// api/create.js
import { createClient } from '@supabase/supabase-js'
import { customAlphabet } from 'nanoid'

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  console.log('=== CREATE API CALLED ===')
  
  try {
    // Parse request body
    let body
    try {
      body = req.body
      console.log('Request body:', body)
    } catch (e) {
      console.error('Failed to parse body:', e)
      return res.status(400).json({ error: 'Invalid request body' })
    }
    
    const { target, alias, mode = 'burst-5' } = body
    
    // Validation
    if (!target) {
      return res.status(400).json({ error: 'Target URL is required' })
    }
    
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      return res.status(400).json({ error: 'URL must start with http:// or https://' })
    }
    
    // Environment variables
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    console.log('ENV Check - URL exists:', !!supabaseUrl)
    console.log('ENV Check - Key exists:', !!supabaseKey)
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables')
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'SUPABASE_URL or SUPABASE_SERVICE_KEY not set'
      })
    }
    
    // Create Supabase client with explicit options
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'apikey': supabaseKey
        }
      }
    })
    
    console.log('Supabase client created')
    
    // Generate IDs
    const nanoid = customAlphabet(alphabet, 10)
    const id = alias 
      ? alias.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase().substring(0, 50)
      : nanoid()
    
    const secretKey = nanoid(32)
    
    console.log('Generated ID:', id)
    console.log('Target URL:', target)
    
    // SIMPLIFIED: Direct insert without checking first
    console.log('Attempting to insert into database...')
    
    const { data, error } = await supabase
      .from('links')
      .insert({
        id: id,
        secret_key: secretKey,
        target_url: target,
        capture_mode: mode,
        alias: alias || null,
        created_at: new Date().toISOString()
      })
      .select()
    
    if (error) {
      console.error('Database error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      
      // Handle specific errors
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({ 
          error: 'This alias is already taken. Please use a different name.' 
        })
      }
      
      if (error.code === '42P01') { // Table doesn't exist
        return res.status(500).json({ 
          error: 'Database table not found',
          solution: 'Please create the "links" table in Supabase'
        })
      }
      
      if (error.message.includes('JWT')) {
        return res.status(500).json({ 
          error: 'Authentication failed',
          details: 'Invalid Supabase service key. Please check your credentials.'
        })
      }
      
      return res.status(500).json({ 
        error: 'Database operation failed',
        code: error.code,
        message: error.message 
      })
    }
    
    console.log('Insert successful:', data)
    
    // Success response
    return res.status(200).json({
      success: true,
      id: id,
      key: secretKey,
      target: target,
      mode: mode,
      link: `https://hjh-official.vercel.app/${id}`,
      backup_key: `${id}:${secretKey}`,
      message: '✅ Link created successfully!'
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      type: error.constructor.name
    })
  }
      }
