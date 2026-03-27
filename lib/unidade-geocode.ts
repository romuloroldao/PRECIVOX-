import { prisma } from '@/lib/prisma';
import { geocodeEnderecoBrasil } from '@/lib/geocoding';

/** Atualiza latitude/longitude a partir do cadastro de endereço. Retorna true se obteve coordenadas. */
export async function sincronizarGeocodificacaoUnidade(unidadeId: string): Promise<boolean> {
  const u = await prisma.unidades.findUnique({
    where: { id: unidadeId },
    select: {
      id: true,
      endereco: true,
      bairro: true,
      cidade: true,
      estado: true,
      cep: true,
    },
  });

  if (!u) {
    return false;
  }

  const coords = await geocodeEnderecoBrasil({
    endereco: u.endereco,
    bairro: u.bairro,
    cidade: u.cidade,
    estado: u.estado,
    cep: u.cep,
  });

  if (!coords) {
    return false;
  }

  await prisma.unidades.update({
    where: { id: unidadeId },
    data: {
      latitude: coords.lat,
      longitude: coords.lon,
      dataAtualizacao: new Date(),
    },
  });

  return true;
}
