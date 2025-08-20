import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { pdf_url } = await request.json()
    
    console.log("Received PDF URL for parsing:", pdf_url)
    
    if (!pdf_url) {
      return NextResponse.json(
        { error: "PDF URL is required" },
        { status: 400 }
      )
    }

    // Validate URL format - allow Supabase signed URLs
    if (!pdf_url.startsWith('https://')) {
      console.error("URL validation failed: not HTTPS")
      return NextResponse.json(
        { error: "Invalid PDF URL format - must be HTTPS" },
        { status: 400 }
      )
    }

    // Check if it's a PDF URL (either has .pdf in path or is a signed URL)
    const isPdfUrl = pdf_url.toLowerCase().includes('.pdf') || 
                     pdf_url.includes('supabase') || // Supabase signed URLs
                     pdf_url.includes('storage')     // Storage service URLs

    if (!isPdfUrl) {
      console.error("URL validation failed: not a PDF URL")
      return NextResponse.json(
        { error: "Invalid PDF URL format - must be a PDF file" },
        { status: 400 }
      )
    }

    // Call the external parse-resume-skill API
    console.log("Calling external API with URL:", pdf_url)
    const response = await fetch('https://parse-resume-skill-709637652952.europe-west1.run.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdf_url }),
      signal: AbortSignal.timeout(60000) // 60 second timeout for complex PDFs
    })

    console.log("External API response status:", response.status)
    const data = await response.json()
    console.log("External API response data:", data)
    
    if (!response.ok) {
      console.error("Parse resume API error:", data)
      return NextResponse.json(
        { error: data.error || 'Failed to parse resume' },
        { status: response.status }
      )
    }

    // Return the parsed data
    return NextResponse.json(data)
    
  } catch (error) {
    console.error("Parse resume API error:", error)
    
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        return NextResponse.json(
          { error: "Resume parsing timed out. Please try again with a smaller file." },
          { status: 408 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to parse resume: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred while parsing the resume" },
      { status: 500 }
    )
  }
}