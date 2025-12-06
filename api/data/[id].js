import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-secret-key')
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { id } = req.query
    const secretKey = req.headers['x-secret-key']
    
    console.log('Fetching data for ID:', id)
    
    if (!secretKey) {
      return res.status(401).json({ error: 'Secret key required' })
    }
    
    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Server configuration error' })
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Verify secret key
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('*')
      .eq('id', id)
      .eq('secret_key', secretKey)
      .single()
    
    if (linkError || !link) {
      return res.status(403).json({ error: 'Invalid ID or secret key' })
    }
    
    // Get captures
    const { data: captures, error: capturesError } = await supabase
      .from('captures')
      .select('*')
      .eq('link_id', id)
      .order('created_at', { ascending: false })
    
    if (capturesError) {
      console.error('Captures error:', capturesError)
      return res.status(500).json({ error: 'Failed to fetch captures' })
    }
    
    // Format response
    const formatted = captures.map(capture => ({
      data: capture.media_data,
      ts: capture.created_at,
      type: capture.media_type || 'image'
    }))
    
    return res.status(200).json(formatted)
    
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Server error' })
  }
                                }
