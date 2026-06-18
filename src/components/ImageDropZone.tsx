import { useRef, useState, DragEvent, ChangeEvent } from 'react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/webp']
const ACCEPTED_EXTS = ['.jpg', '.jpeg', '.webp']

interface Props {
  label: string
  sublabel: string
  file: File | null
  onFile: (file: File) => void
  onClear: () => void
}

function isValidFile(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) return true
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTS.some((ext) => name.endsWith(ext))
}

export default function ImageDropZone({ label, sublabel, file, onFile, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [typeError, setTypeError] = useState(false)

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const selected = files[0]
    if (!isValidFile(selected)) {
      setTypeError(true)
      return
    }
    setTypeError(false)
    onFile(selected)
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave() {
    setDragging(false)
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files)
    e.target.value = ''
  }

  const previewUrl = file ? URL.createObjectURL(file) : null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          'relative flex flex-col items-center justify-center gap-3 rounded-sm border-2 border-dashed cursor-pointer transition-colors duration-150 overflow-hidden',
          'min-h-[220px]',
          dragging
            ? 'border-gray-900 bg-gray-50'
            : file
            ? 'border-gray-300 bg-white'
            : 'border-gray-200 bg-gray-50 hover:border-gray-400',
        ].join(' ')}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="preview"
              className="absolute inset-0 w-full h-full object-contain p-2"
              onLoad={() => URL.revokeObjectURL(previewUrl)}
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear() }}
              className="absolute top-2 right-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-white/90 shadow hover:bg-red-50 hover:text-red-600 text-gray-500 transition-colors duration-150"
              aria-label="Remove image"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <UploadIcon />
            <div className="text-center px-4">
              <p className="text-sm font-medium text-gray-700">{sublabel}</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, JPEG or WEBP</p>
            </div>
          </>
        )}

        {file && (
          <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm px-3 py-1.5">
            <p className="text-xs text-gray-600 truncate">{file.name}</p>
          </div>
        )}
      </div>

      {typeError && (
        <p className="text-xs text-red-500">Only .jpg, .jpeg, or .webp files are accepted.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.webp,image/jpeg,image/webp"
        className="hidden"
        onChange={onChange}
      />
    </div>
  )
}

function UploadIcon() {
  return (
    <svg
      className="w-8 h-8 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  )
}
