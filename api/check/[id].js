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
    
    console.log('Checking link:', id)
    
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
    
    // Check link
    const { data: link, error } = await supabase
      .from('links')
      .select('id, target_url, capture_mode, alias')
      .eq('id', id)
      .eq('secret_key', secretKey)
      .single()
    
    if (error || !link) {
      return res.status(404).json({ error: 'Link not found or invalid key' })
    }
    
    return res.status(200).json({
      target: link.target_url,
      mode: link.capture_mode,
      alias: link.alias
    })
    
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Server error' })
  }
        }
