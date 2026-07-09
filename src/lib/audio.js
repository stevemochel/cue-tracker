import { supabase } from './supabase'

// Private Supabase Storage bucket that holds each cue's audio file.
export const AUDIO_BUCKET = 'cue-audio'

// Files are stored under the owner's user id so Storage RLS can scope access:
//   <user_id>/<cue_id>.<ext>
function pathFor(userId, cueId, ext) {
  return `${userId}/${cueId}.${ext}`
}

export async function uploadCueAudio(userId, cueId, file) {
  const ext = (file.name.split('.').pop() || 'mp3').toLowerCase()
  const path = pathFor(userId, cueId, ext)
  const { error } = await supabase.storage.from(AUDIO_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || 'audio/mpeg',
  })
  if (error) throw error
  return path
}

// Private bucket -> mint a short-lived signed URL to play/download.
export async function getAudioUrl(path, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(AUDIO_BUCKET).createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export async function removeCueAudio(path) {
  const { error } = await supabase.storage.from(AUDIO_BUCKET).remove([path])
  if (error) throw error
}
