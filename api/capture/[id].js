import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // CORS headers - IMPORTANT
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  // Handle OPTIONS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  console.log('=== CAPTURE API CALLED ===')
  
  try {
    // Get link ID from URL
    const { id } = req.query
    console.log('Capture for link ID:', id)
    
    // Parse request body
    let body
    try {
      body = await req.body
      console.log('Request body received')
    } catch (e) {
      console.error('Body parse error:', e)
      return res.status(400).json({ error: 'Invalid request body' })
    }
    
    const { mediaData, mediaType = 'image' } = body
    
    // Validate
    if (!mediaData) {
      return res.status(400).json({ error: 'Media data is required' })
    }
    
    console.log('Media type:', mediaType, 'Data length:', mediaData.length)
    
    // Check if link exists first (optional)
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      return res.status(500).json({ error: 'Server configuration error' })
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Optional: Verify link exists
    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id')
      .eq('id', id)
      .single()
    
    if (linkError) {
      console.log('Link not found or error:', linkError)
      // Still accept capture even if link check fails
    }
    
    // Save capture to database
    console.log('Saving capture to database...')
    const { data, error: insertError } = await supabase
      .from('captures')
      .insert({
        link_id: id,
        media_data: mediaData,
        media_type: mediaType,
        created_at: new Date().toISOString()
      })
      .select()
    
    if (insertError) {
      console.error('Database insert error:', insertError)
      
      // If table doesn't exist
      if (insertError.code === '42P01') {
        return res.status(500).json({ 
          error: 'Database table not found',
          solution: 'Create "captures" table in Supabase'
        })
      }
      
      return res.status(500).json({ 
        error: 'Failed to save capture',
        details: insertError.message 
      })
    }
    
    console.log('Capture saved successfully:', data)
    
    return res.status(200).json({
      success: true,
      message: 'Capture saved successfully',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Unexpected error in capture:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
          }
