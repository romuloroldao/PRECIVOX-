import { NextRequest, NextResponse } from 'next/server';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const width = searchParams.get('w') || '150';
    const height = searchParams.get('h') || '150';
    
    // Validar dimensões
    const w = parseInt(width);
    const h = parseInt(height);
    
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0 || w > 2000 || h > 2000) {
      return new NextResponse('Dimensões inválidas', { status: 400 });
    }
    
    // Obter parâmetros opcionais
    const text = searchParams.get('text') || `${w}x${h}`;
    const bgColor = searchParams.get('bg') || '004A7C';
    const textColor = searchParams.get('color') || 'white';
    const fontSize = Math.min(w, h) * 0.1; // 10% da menor dimensão
    
    // Criar SVG placeholder
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#${bgColor}"/>
        <text 
          x="50%" 
          y="50%" 
          font-family="Arial, sans-serif" 
          font-size="${fontSize}" 
          fill="${textColor}" 
          text-anchor="middle" 
          dominant-baseline="middle"
        >
          ${text}
        </text>
      </svg>
    `;
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000', // Cache por 1 ano
      },
    });
  } catch (error) {
    console.error('Erro ao gerar placeholder:', error);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}