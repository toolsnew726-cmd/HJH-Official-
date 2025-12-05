import { supabase } from '../../../lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  try {
    const { id } = req.query
    const { mediaData, mediaType = 'image' } = req.body

    if (!mediaData) {
      return res.status(400).json({ error: 'Media data required' })
    }

    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('id')
      .eq('id', id)
      .single()

    if (linkError || !link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    const { error } = await supabase
      .from('captures')
      .insert({
        link_id: id,
        media_data: mediaData,
        media_type: mediaType,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    res.status(200).json({ 
      success: true,
      message: 'Capture saved'
    })

  } catch (error) {
    console.error('Capture error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
        }
