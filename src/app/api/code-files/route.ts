import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const basePath = '/home/z/my-project/download'

    const [htmlContent, jsContent] = await Promise.all([
      readFile(join(basePath, 'dashboard-tts-denise.html'), 'utf-8'),
      readFile(join(basePath, 'functions-api-tts.js'), 'utf-8'),
    ])

    return NextResponse.json({
      files: [
        {
          name: 'dashboard.html',
          path: 'dashboard.html',
          content: htmlContent,
          language: 'html',
          lines: htmlContent.split('\n').length,
        },
        {
          name: 'functions/api/tts.js',
          path: 'functions/api/tts.js',
          content: jsContent,
          language: 'javascript',
          lines: jsContent.split('\n').length,
        },
      ],
    })
  } catch (error) {
    console.error('Error reading code files:', error)
    return NextResponse.json(
      { error: 'Impossible de lire les fichiers' },
      { status: 500 }
    )
  }
}
