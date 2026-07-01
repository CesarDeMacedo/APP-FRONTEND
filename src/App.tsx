import { useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import ImageDropZone from './components/ImageDropZone'
import Auth from './components/Auth'
import { supabase } from './lib/supabaseClient'

const GENERATE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [image1, setImage1] = useState<File | null>(null)
  const [image2, setImage2] = useState<File | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prevResultUrl = useRef<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleGenerate() {
    if (!image1 || !image2) {
      alert('Please upload both images.')
      return
    }
    if (!session) return

    setLoading(true)
    setError(null)

    // Revoke previous blob URL to free memory
    if (prevResultUrl.current) {
      URL.revokeObjectURL(prevResultUrl.current)
      prevResultUrl.current = null
    }

    try {
      const form = new FormData()
      form.append('image1', image1)
      form.append('image2', image2)

      const response = await fetch(GENERATE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: form,
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      prevResultUrl.current = url
      setResultUrl(url)
    } catch {
      setError('Failed to generate image. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canGenerate = !!image1 && !!image2 && !loading

  if (sessionLoading) return null

  if (!session) return <Auth />

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 py-5 px-6 flex items-center justify-center relative">
        <span className="tracking-[0.25em] text-xs font-semibold uppercase text-gray-900">
          AI Image Generator
        </span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="absolute right-6 text-xs text-gray-400 hover:text-gray-600 transition-colors duration-150"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-10">
        {/* Upload Section */}
        <section className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-light tracking-tight text-gray-900">Generate</h1>
            <p className="text-sm text-gray-400 mt-1">
              Upload a person photo and a clothing item to generate a try-on image.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ImageDropZone
              label="Image 1"
              sublabel="Upload person photo"
              file={image1}
              onFile={setImage1}
              onClear={() => setImage1(null)}
            />
            <ImageDropZone
              label="Image 2"
              sublabel="Upload clothing item"
              file={image2}
              onFile={setImage2}
              onClear={() => setImage2(null)}
            />
          </div>
        </section>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={[
            'w-full py-3.5 text-sm font-medium tracking-widest uppercase transition-colors duration-150',
            canGenerate
              ? 'bg-gray-900 text-white hover:bg-gray-700 cursor-pointer'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          ].join(' ')}
        >
          {loading ? 'Generating…' : 'Generate Image'}
        </button>

        {/* Output Area */}
        {(loading || resultUrl || error) && (
          <section className="flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Result</p>

            {loading && (
              <div className="flex items-center justify-center min-h-[260px] border border-gray-100 bg-gray-50">
                <Spinner />
              </div>
            )}

            {!loading && error && (
              <div className="flex items-center justify-center min-h-[100px] border border-red-100 bg-red-50 rounded-sm px-6">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            {!loading && resultUrl && !error && (
              <div className="flex flex-col gap-3">
                <div className="border border-gray-100 overflow-hidden">
                  <img
                    src={resultUrl}
                    alt="Generated result"
                    className="w-full h-auto block"
                  />
                </div>
                <a
                  href={resultUrl}
                  download="generated-image.png"
                  className="w-full py-3.5 text-sm font-medium tracking-widest uppercase text-center transition-colors duration-150 bg-gray-900 text-white hover:bg-gray-700"
                >
                  Download Image
                </a>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

function Spinner() {
  return (
    <div
      className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin"
      role="status"
      aria-label="Loading"
    />
  )
}
