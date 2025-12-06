import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  
  try {
    const { id } = req.query
    const body = await req.body
    const { mediaData, mediaType = 'image' } = body
    
    console.log(`Capture for ${id}: ${mediaType}, size: ${mediaData?.length || 0}`)
    
    if (!mediaData) {
      return res.status(400).json({ error: 'No data' })
    }
    
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Server error' })
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { error } = await supabase
      .from('captures')
      .insert({
        link_id: id,
        media_data: mediaData,
        media_type: mediaType,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Save error:', error)
      return res.status(500).json({ error: 'Database error' })
    }
    
    return res.json({ success: true })
    
  } catch (error) {
    console.error('Error:', error)
    return res.status(500).json({ error: 'Server error' })
  }
}
