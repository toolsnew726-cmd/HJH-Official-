import { supabase } from '../../../lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    const secretKey = req.headers['x-secret-key']

    if (!secretKey) {
      return res.status(401).json({ error: 'Secret key required' })
    }

    const { data: link, error: linkError } = await supabase
      .from('links')
      .select('*')
      .eq('id', id)
      .eq('secret_key', secretKey)
      .single()

    if (linkError || !link) {
      return res.status(403).json({ error: 'Invalid ID or secret key' })
    }

    const { data: captures, error: capturesError } = await supabase
      .from('captures')
      .select('*')
      .eq('link_id', id)
      .order('created_at', { ascending: false })

    if (capturesError) throw capturesError

    const formatted = captures.map(capture => ({
      data: capture.media_data,
      ts: capture.created_at,
      type: capture.media_type
    }))

    res.status(200).json(formatted)

  } catch (error) {
    console.error('Data fetch error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
      }
