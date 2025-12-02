/**
 * Pagination Helper Middleware
 * Adiciona suporte a paginação nas APIs
 */

/**
 * Extrai parâmetros de paginação da query string
 */
export function getPaginationParams(req) {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Máximo 100 itens
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
}

/**
 * Cria resposta paginada
 */
export function createPaginatedResponse(data, total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Middleware que adiciona helpers de paginação ao req
 */
export function paginationMiddleware(req, res, next) {
  req.pagination = getPaginationParams(req);
  
  // Helper para criar resposta paginada
  res.paginate = (data, total) => {
    return res.json(
      createPaginatedResponse(
        data,
        total,
        req.pagination.page,
        req.pagination.limit
      )
    );
  };
  
  next();
}
