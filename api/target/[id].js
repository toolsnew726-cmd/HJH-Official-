import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { id } = req.query
    
    console.log('Fetching target for ID:', id)
    
    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Server configuration error' })
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get target URL
    const { data: link, error } = await supabase
      .from('links')
      .select('target_url')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return res.status(404).json({ error: 'Link not found' })
    }
    
    if (!link) {
      return res.status(404).json({ error: 'Link not found' })
    }
    
    return res.status(200).json({
      targetUrl: link.target_url,
      success: true
    })
    
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Server error' })
  }
      }
