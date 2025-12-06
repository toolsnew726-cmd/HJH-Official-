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
  
  try {
    // Get request body
    const body = await req.body
    const { target, alias, mode = 'burst-5' } = body
    
    console.log('Received request:', { target, alias, mode })
    
    // Validate
    if (!target) {
      return res.status(400).json({ 
        error: 'Target URL is required' 
      })
    }
    
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      return res.status(400).json({ 
        error: 'URL must start with http:// or https://' 
      })
    }
    
    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    console.log('Supabase URL exists:', !!supabaseUrl)
    console.log('Supabase Key exists:', !!supabaseKey)
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      return res.status(500).json({ 
        error: 'Server configuration error' 
      })
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Generate ID and key
    const nanoid = customAlphabet(alphabet, 10)
    const id = alias 
      ? alias.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase()
      : nanoid()
    
    const secretKey = nanoid(32)
    
    console.log('Generated ID:', id)
    
    // Check if ID exists
    const { data: existing, error: checkError } = await supabase
      .from('links')
      .select('id')
      .eq('id', id)
      .maybeSingle()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Check error:', checkError)
      return res.status(500).json({ 
        error: 'Database error while checking existing ID' 
      })
    }
    
    if (existing) {
      return res.status(400).json({ 
        error: 'This alias/ID is already taken. Please try a different name.' 
      })
    }
    
    // Save to database
    const { error: insertError } = await supabase
      .from('links')
      .insert({
        id,
        secret_key: secretKey,
        target_url: target,
        capture_mode: mode,
        alias: alias || null,
        created_at: new Date().toISOString()
      })
    
    if (insertError) {
      console.error('Database insert error:', insertError)
      return res.status(500).json({ 
        error: 'Failed to save link to database',
        details: insertError.message 
      })
    }
    
    console.log('Link created successfully:', id)
    
    // Success response
    return res.status(200).json({
      success: true,
      id,
      key: secretKey,
      target,
      mode,
      link: `https://hjh-official.vercel.app/${id}`,
      admin_link: `${id}:${secretKey}`,
      message: '✅ Link created successfully!'
    })
    
  } catch (error) {
    console.error('Server error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
      }
