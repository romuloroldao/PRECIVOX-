/**
 * Utilitários de Geolocalização e Cálculo de Rotas
 */

export interface Coordenadas {
    latitude: number;
    longitude: number;
}

export interface RotaInfo {
    distanciaKm: number;
    tempoEstimadoMin: number;
    custoDeslocamento: number;
    economiaLiquida: number;
}

export interface ScoreCustoBeneficio {
    score: number; // 0-100
    categoria: 'Excelente' | 'Bom' | 'Regular' | 'Não Recomendado';
    razao: string;
}

/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 * @param coord1 Coordenadas do ponto 1
 * @param coord2 Coordenadas do ponto 2
 * @returns Distância em quilômetros
 */
export function calcularDistancia(coord1: Coordenadas, coord2: Coordenadas): number {
    const R = 6371; // Raio da Terra em km
    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(coord1.latitude)) *
        Math.cos(toRad(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distancia = R * c;

    return Math.round(distancia * 10) / 10; // Arredondar para 1 casa decimal
}

/**
 * Converte graus para radianos
 */
function toRad(graus: number): number {
    return graus * (Math.PI / 180);
}

/**
 * Calcula informações de rota entre dois pontos
 * @param origem Coordenadas de origem
 * @param destino Coordenadas de destino
 * @param economia Economia de preço em reais
 * @param velocidadeMediaKmH Velocidade média em km/h (padrão: 30 km/h urbano)
 * @param custoPorKm Custo de deslocamento por km (padrão: R$ 0.50/km)
 * @returns Informações da rota
 */
export function calcularRota(
    origem: Coordenadas,
    destino: Coordenadas,
    economia: number,
    velocidadeMediaKmH: number = 30,
    custoPorKm: number = 0.50
): RotaInfo {
    const distanciaKm = calcularDistancia(origem, destino);
    const tempoEstimadoMin = Math.round((distanciaKm / velocidadeMediaKmH) * 60);
    const custoDeslocamento = Math.round(distanciaKm * custoPorKm * 100) / 100;
    const economiaLiquida = Math.round((economia - custoDeslocamento) * 100) / 100;

    return {
        distanciaKm,
        tempoEstimadoMin,
        custoDeslocamento,
        economiaLiquida,
    };
}

/**
 * Calcula o score de custo-benefício de uma oferta
 * @param economia Economia de preço em reais
 * @param precoAtual Preço atual do produto
 * @param distanciaKm Distância até o mercado
 * @param tempoMin Tempo estimado de deslocamento
 * @param disponivel Se o produto está disponível
 * @returns Score de custo-benefício
 */
export function calcularScoreCustoBeneficio(
    economia: number,
    precoAtual: number,
    distanciaKm: number,
    tempoMin: number,
    disponivel: boolean = true
): ScoreCustoBeneficio {
    // Pesos dos fatores
    const PESO_ECONOMIA = 40;
    const PESO_DISTANCIA = 30;
    const PESO_TEMPO = 20;
    const PESO_DISPONIBILIDADE = 10;

    // Calcular scores individuais (0-1)
    const economiaPercentual = precoAtual > 0 ? economia / precoAtual : 0;
    const economiaScore = Math.min(economiaPercentual * PESO_ECONOMIA * 100, PESO_ECONOMIA);

    // Distância: quanto menor, melhor (máximo 5km considerado ideal)
    const distanciaScore = Math.max(0, (5 - distanciaKm) / 5) * PESO_DISTANCIA;

    // Tempo: quanto menor, melhor (máximo 15min considerado ideal)
    const tempoScore = Math.max(0, (15 - tempoMin) / 15) * PESO_TEMPO;

    // Disponibilidade: binário
    const disponibilidadeScore = disponivel ? PESO_DISPONIBILIDADE : 0;

    // Score total (0-100)
    const score = Math.round(economiaScore + distanciaScore + tempoScore + disponibilidadeScore);

    // Determinar categoria
    let categoria: ScoreCustoBeneficio['categoria'];
    if (score >= 80) {
        categoria = 'Excelente';
    } else if (score >= 60) {
        categoria = 'Bom';
    } else if (score >= 40) {
        categoria = 'Regular';
    } else {
        categoria = 'Não Recomendado';
    }

    // Gerar razão
    const razao = gerarRazao(economia, distanciaKm, tempoMin, score);

    return {
        score,
        categoria,
        razao,
    };
}

/**
 * Gera uma razão textual para o score
 */
function gerarRazao(
    economia: number,
    distanciaKm: number,
    tempoMin: number,
    score: number
): string {
    if (score >= 80) {
        return `Excelente opção! Economia de R$ ${economia.toFixed(2)} a apenas ${distanciaKm.toFixed(1)}km (${tempoMin} min).`;
    } else if (score >= 60) {
        if (distanciaKm > 3) {
            return `Boa economia de R$ ${economia.toFixed(2)}, mas considere a distância de ${distanciaKm.toFixed(1)}km.`;
        } else {
            return `Boa opção com economia de R$ ${economia.toFixed(2)} e distância conveniente.`;
        }
    } else if (score >= 40) {
        if (economia < 1) {
            return `Economia pequena (R$ ${economia.toFixed(2)}) vs distância de ${distanciaKm.toFixed(1)}km - Avalie se compensa.`;
        } else {
            return `Economia moderada, mas considere o tempo de deslocamento (${tempoMin} min).`;
        }
    } else {
        const custoDeslocamento = distanciaKm * 0.50;
        if (economia < custoDeslocamento) {
            return `Não recomendado: custo de deslocamento (R$ ${custoDeslocamento.toFixed(2)}) maior que economia.`;
        } else {
            return `Economia muito pequena para justificar o deslocamento.`;
        }
    }
}

/**
 * Coordenadas padrão (Franco da Rocha, SP - centro)
 * Usar como fallback quando o usuário não tiver localização
 */
export const COORDENADAS_PADRAO: Coordenadas = {
    latitude: -23.3217,
    longitude: -46.7289,
};
