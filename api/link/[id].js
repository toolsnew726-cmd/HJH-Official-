import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  
  try {
    const { id } = req.query
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Server error' })
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data, error } = await supabase
      .from('links')
      .select('target_url, capture_mode')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      return res.status(404).json({ error: 'Link not found' })
    }
    
    return res.json({
      targetUrl: data.target_url,
      mode: data.capture_mode
    })
    
  } catch (error) {
    return res.status(500).json({ error: 'Server error' })
  }
      }
