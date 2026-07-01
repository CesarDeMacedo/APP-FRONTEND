import { FormEvent, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type Mode = 'login' | 'signup'

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      setLoading(false)
      if (error) {
        setError(error.message)
        return
      }
      setCheckEmail(true)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  function switchMode() {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError(null)
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="max-w-sm w-full flex flex-col gap-4 text-center">
          <h1 className="text-2xl font-light tracking-tight text-gray-900">Check your email</h1>
          <p className="text-sm text-gray-400">
            We sent a confirmation link to <span className="text-gray-700">{email}</span>. Confirm your
            account, then log in below.
          </p>
          <button
            onClick={() => {
              setCheckEmail(false)
              setMode('login')
            }}
            className="w-full py-3.5 text-sm font-medium tracking-widest uppercase bg-gray-900 text-white hover:bg-gray-700 transition-colors duration-150"
          >
            Back to Log In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-sm w-full flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-gray-900">
            {mode === 'login' ? 'Log In' : 'Sign Up'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {mode === 'login'
              ? 'Log in to use the image generator.'
              : 'Create an account to get started.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={[
              'w-full py-3.5 text-sm font-medium tracking-widest uppercase transition-colors duration-150',
              loading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-700 cursor-pointer',
            ].join(' ')}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <button
          onClick={switchMode}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors duration-150"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}
