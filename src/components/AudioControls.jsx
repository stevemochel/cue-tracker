import { useRef, useState } from 'react'
import { uploadCueAudio, getAudioUrl, removeCueAudio } from '../lib/audio'

// Upload / play / remove a cue's audio file.
// - `compact` (table cell): an "Upload MP3" button when empty, a "Play" button
//   that expands to an inline player when a file exists.
// - full (edit window): player + Replace + Remove.
// Signed URLs are only fetched when the user actually clicks Play, so opening a
// table of 66 cues doesn't mint 66 URLs up front.
export default function AudioControls({ cue, userId, onChange, compact = false }) {
  const [path, setPath] = useState(cue.audioPath || '')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  const pick = () => inputRef.current?.click()

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const newPath = await uploadCueAudio(userId, cue.id, file)
      setPath(newPath)
      setUrl('')
      onChange?.(newPath)
    } catch (ex) {
      window.alert('Upload failed: ' + (ex.message || ex))
    } finally {
      setBusy(false)
    }
  }

  const play = async () => {
    setBusy(true)
    try {
      setUrl(await getAudioUrl(path))
    } catch (ex) {
      window.alert('Could not load audio: ' + (ex.message || ex))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('Remove this audio file?')) return
    setBusy(true)
    try {
      await removeCueAudio(path)
      setPath('')
      setUrl('')
      onChange?.('')
    } catch (ex) {
      window.alert('Could not remove: ' + (ex.message || ex))
    } finally {
      setBusy(false)
    }
  }

  const fileInput = (
    <input ref={inputRef} type="file" accept=".mp3,.wav,.m4a,audio/*" style={{ display: 'none' }} onChange={onFile} />
  )

  if (!path) {
    return (
      <>
        {fileInput}
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={pick} title="Upload an MP3">
          {busy ? 'Uploading…' : '⬆ MP3'}
        </button>
      </>
    )
  }

  if (compact) {
    return (
      <>
        {fileInput}
        {url ? (
          <audio src={url} controls autoPlay style={{ height: 30, verticalAlign: 'middle', maxWidth: 190 }} />
        ) : (
          <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={play} title="Play">
            {busy ? '…' : '▶ Play'}
          </button>
        )}
      </>
    )
  }

  return (
    <>
      {fileInput}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {url ? (
          <audio src={url} controls autoPlay style={{ height: 34 }} />
        ) : (
          <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={play}>
            {busy ? 'Loading…' : '▶ Play'}
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={pick}>Replace</button>
        <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={remove}>Remove</button>
      </div>
    </>
  )
}
