'use server'

import { createClient } from '@/lib/auth'
import { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'

export interface Preferences {
  currency: string
  [key: string]: any
}

export async function getUserPreferences(): Promise<Preferences> {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      // Return default preferences if user is not authenticated
      return { currency: 'INR' }
    }

    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // If no preferences exist, return defaults
      if (error.code === 'PGRST116') {
        return { currency: 'INR' }
      }
      throw new Error(`Failed to fetch user preferences: ${error.message}`)
    }

    return preferences.preferences as Preferences
  } catch (error) {
    // Fallback to defaults if anything fails
    console.log('Failed to get user preferences, using defaults:', error)
    return { currency: 'INR' }
  }
}

export async function updateUserPreferences(newPreferences: Partial<Preferences>) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  // First try to get existing preferences
  const { data: existing } = await supabase
    .from('user_preferences')
    .select('preferences')
    .eq('user_id', user.id)
    .single()

  const currentPreferences = existing?.preferences as Preferences || { currency: 'INR' }
  const updatedPreferences = { ...currentPreferences, ...newPreferences }

  if (existing) {
    // Update existing preferences
    const { error } = await supabase
      .from('user_preferences')
      .update({ preferences: updatedPreferences })
      .eq('user_id', user.id)

    if (error) {
      throw new Error(`Failed to update user preferences: ${error.message}`)
    }
  } else {
    // Insert new preferences
    const { error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: user.id,
        preferences: updatedPreferences
      })

    if (error) {
      throw new Error(`Failed to create user preferences: ${error.message}`)
    }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  revalidatePath('/accounts')
  revalidatePath('/transactions')
  revalidatePath('/loans')
}
