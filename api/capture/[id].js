import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { id } = req.query
    const body = await req.body
    const { mediaData, mediaType = 'image' } = body
    
    console.log('Capture request for ID:', id)
    
    if (!mediaData) {
      return res.status(400).json({ error: 'Media data required' })
    }
    
    // Get Supabase credentials
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Server configuration error' })
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Check if link exists
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id')
      .eq('id', id)
      .single()
    
    if (linkError || !link) {
      return res.status(404).json({ error: 'Link not found' })
    }
    
    // Save capture
    const { error: insertError } = await supabase
      .from('captures')
      .insert({
        link_id: id,
        media_data: mediaData,
        media_type: mediaType,
        created_at: new Date().toISOString()
      })
    
    if (insertError) {
      console.error('Insert error:', insertError)
      return res.status(500).json({ error: 'Failed to save capture' })
    }
    
    return res.status(200).json({ 
      success: true,
      message: 'Capture saved successfully'
    })
    
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Server error' })
  }
      }
