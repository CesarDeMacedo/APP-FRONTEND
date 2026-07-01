import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from 'jsr:@supabase/supabase-js@2/cors'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent'
const PROMPT_INTRO =
  'You will be given two images. Generate one new photorealistic image showing the person ' +
  'from the first image wearing the clothing item from the second image. Completely remove ' +
  "and replace the person's entire original outfit — every garment they are currently " +
  'wearing (top, bottom, dress, outerwear, all of it) — so that none of their original ' +
  'clothing remains visible anywhere. The garment from the second image should be the only ' +
  "thing they are wearing afterward. Keep the person's face, body, pose, and the background " +
  'from the first image unchanged.'

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // verify_jwt only checks that the Authorization header is a validly-signed JWT —
  // it accepts the public anon key too. Explicitly require a real signed-in user.
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
  )
  const {
    data: { user },
  } = await supabaseClient.auth.getUser()

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY secret is not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const form = await req.formData()
    const image1 = form.get('image1')
    const image2 = form.get('image2')

    if (!(image1 instanceof File) || !(image2 instanceof File)) {
      return new Response(JSON.stringify({ error: 'image1 and image2 are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const [data1, data2] = await Promise.all([fileToBase64(image1), fileToBase64(image2)])

    const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT_INTRO },
              { text: 'First image (the person):' },
              { inline_data: { mime_type: image1.type || 'image/jpeg', data: data1 } },
              { text: 'Second image (the clothing item to put on them):' },
              { inline_data: { mime_type: image2.type || 'image/jpeg', data: data2 } },
            ],
          },
        ],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    })

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      return new Response(JSON.stringify({ error: `Gemini API error: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiJson = await geminiResponse.json()
    const parts = geminiJson.candidates?.[0]?.content?.parts ?? []
    const imagePart = parts.find((p: { inlineData?: { data?: string } }) => p.inlineData?.data)

    if (!imagePart) {
      return new Response(JSON.stringify({ error: 'Gemini did not return an image' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const outputBytes = Uint8Array.from(atob(imagePart.inlineData.data), (c) => c.charCodeAt(0))

    return new Response(outputBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': imagePart.inlineData.mimeType ?? 'image/png',
      },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to generate image' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
