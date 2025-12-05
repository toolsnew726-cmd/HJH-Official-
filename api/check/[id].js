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

    const { data: link, error } = await supabase
      .from('links')
      .select('id, target_url, capture_mode, alias')
      .eq('id', id)
      .eq('secret_key', secretKey)
      .single()

    if (error || !link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    res.status(200).json({
      target: link.target_url,
      mode: link.capture_mode,
      alias: link.alias
    })

  } catch (error) {
    console.error('Check error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
      }
