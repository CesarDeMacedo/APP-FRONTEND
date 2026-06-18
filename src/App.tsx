import { useRef, useState } from 'react'
import ImageDropZone from './components/ImageDropZone'

const WEBHOOK_URL =
  'https://cesardemacedo.app.n8n.cloud/webhook/eb00b9cf-91b8-4544-bcd3-f27cbbc94d89'

export default function App() {
  const [image1, setImage1] = useState<File | null>(null)
  const [image2, setImage2] = useState<File | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prevResultUrl = useRef<string | null>(null)

  async function handleGenerate() {
    if (!image1 || !image2) {
      alert('Please upload both images.')
      return
    }

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

      const response = await fetch(WEBHOOK_URL, { method: 'POST', body: form })

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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 py-5 px-6 flex items-center justify-center">
        <span className="tracking-[0.25em] text-xs font-semibold uppercase text-gray-900">
          AI Image Generator
        </span>
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
              <div className="border border-gray-100 overflow-hidden">
                <img
                  src={resultUrl}
                  alt="Generated result"
                  className="w-full h-auto block"
                />
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
