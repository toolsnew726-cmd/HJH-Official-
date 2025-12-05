import { supabase } from '../../lib/supabase.js'
import { generateId, generateSecretKey } from '../../utils/helpers.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { target, alias, mode = 'burst-5' } = req.body

    if (!target || !target.startsWith('http')) {
      return res.status(400).json({ error: 'Valid URL is required' })
    }

    const id = alias ? 
      alias.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase() : 
      generateId(10)
    
    const secretKey = generateSecretKey()

    const { data: existing } = await supabase
      .from('links')
      .select('id')
      .eq('id', id)
      .single()

    if (existing) {
      return res.status(400).json({ error: 'ID already exists' })
    }

    const { error } = await supabase
      .from('links')
      .insert({
        id,
        secret_key: secretKey,
        target_url: target,
        capture_mode: mode,
        alias: alias || null,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    res.status(200).json({
      success: true,
      id,
      key: secretKey,
      target,
      mode
    })

  } catch (error) {
    console.error('Create error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
        }
