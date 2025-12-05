import { supabase } from '../../../lib/supabase.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    const { data: link, error } = await supabase
      .from('links')
      .select('target_url')
      .eq('id', id)
      .single()

    if (error || !link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    res.status(200).json({
      targetUrl: link.target_url,
      success: true
    })

  } catch (error) {
    console.error('Target error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
      }
