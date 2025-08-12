// models/Market.js - Model para gerenciamento de mercados
import { query, transaction } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class Market {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || null;
    this.slug = data.slug || null;
    this.description = data.description || null;
    this.cnpj = data.cnpj || null;
    this.business_name = data.business_name || null;
    this.business_type = data.business_type || null;
    this.website_url = data.website_url || null;
    this.email = data.email || null;
    this.phone = data.phone || null;
    this.whatsapp = data.whatsapp || null;
    this.address_street = data.address_street || null;
    this.address_number = data.address_number || null;
    this.address_complement = data.address_complement || null;
    this.address_neighborhood = data.address_neighborhood || null;
    this.address_city = data.address_city || null;
    this.address_state = data.address_state || null;
    this.address_zip_code = data.address_zip_code || null;
    this.address_country = data.address_country || 'Brasil';
    this.latitude = data.latitude || null;
    this.longitude = data.longitude || null;
    this.operating_hours = data.operating_hours || null;
    this.category = data.category || null;
    this.size_category = data.size_category || null;
    this.delivery_available = data.delivery_available !== false;
    this.pickup_available = data.pickup_available !== false;
    this.payment_methods = data.payment_methods || null;
    this.status = data.status || 'pending';
    this.verified = data.verified || false;
    this.verification_date = data.verification_date || null;
    this.logo_url = data.logo_url || null;
    this.cover_image_url = data.cover_image_url || null;
    this.gallery_images = data.gallery_images || null;
    this.total_products = data.total_products || 0;
    this.total_categories = data.total_categories || 0;
    this.average_rating = data.average_rating || 0;
    this.total_reviews = data.total_reviews || 0;
    this.total_users = data.total_users || 0;
    this.has_database = data.has_database || false;
    this.last_data_sync = data.last_data_sync || null;
    this.data_sync_frequency = data.data_sync_frequency || 24;
    this.database_size_mb = data.database_size_mb || 0;
    this.total_records = data.total_records || 0;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.created_by = data.created_by || null;
    this.updated_by = data.updated_by || null;
  }

  // Gerar slug a partir do nome
  static generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Troca espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim('-'); // Remove hífens do início/fim
  }

  // Criar novo mercado
  static async create(marketData, createdBy = null) {
    try {
      const {
        name,
        cnpj,
        email,
        phone,
        address_street,
        address_city,
        address_state,
        address_zip_code,
        ...otherData
      } = marketData;

      // Gerar slug único
      let slug = this.generateSlug(name);
      const existingSlugCount = await query(
        'SELECT COUNT(*) FROM markets WHERE slug LIKE $1',
        [`${slug}%`]
      );
      
      if (parseInt(existingSlugCount.rows[0].count) > 0) {
        slug = `${slug}-${Date.now()}`;
      }

      const sql = `
        INSERT INTO markets (
          name, slug, cnpj, email, phone,
          address_street, address_city, address_state, address_zip_code,
          description, business_name, business_type, website_url, whatsapp,
          address_number, address_complement, address_neighborhood,
          latitude, longitude, operating_hours, category, size_category,
          delivery_available, pickup_available, payment_methods,
          logo_url, cover_image_url, gallery_images,
          created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29
        )
        RETURNING *
      `;

      const values = [
        name.trim(),
        slug,
        cnpj,
        email?.toLowerCase().trim(),
        phone,
        address_street,
        address_city,
        address_state,
        address_zip_code,
        otherData.description,
        otherData.business_name,
        otherData.business_type,
        otherData.website_url,
        otherData.whatsapp,
        otherData.address_number,
        otherData.address_complement,
        otherData.address_neighborhood,
        otherData.latitude,
        otherData.longitude,
        otherData.operating_hours ? JSON.stringify(otherData.operating_hours) : null,
        otherData.category,
        otherData.size_category,
        otherData.delivery_available,
        otherData.pickup_available,
        otherData.payment_methods ? JSON.stringify(otherData.payment_methods) : null,
        otherData.logo_url,
        otherData.cover_image_url,
        otherData.gallery_images ? JSON.stringify(otherData.gallery_images) : null,
        createdBy
      ];

      const result = await query(sql, values);
      return new Market(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao criar mercado:', error);
      throw error;
    }
  }

  // Criar mercado com transação atômica
  static async createWithTransaction(client, marketData, createdBy = null) {
    try {
      const {
        name,
        cnpj,
        email,
        phone,
        address_street,
        address_city,
        address_state,
        address_zip_code,
        ...otherData
      } = marketData;

      // Verificar CNPJ único
      const existingCNPJ = await client.query(
        'SELECT id FROM markets WHERE cnpj = $1 AND status != $2',
        [cnpj, 'inactive']
      );
      
      if (existingCNPJ.rows.length > 0) {
        const error = new Error('CNPJ já está cadastrado');
        error.code = 'DUPLICATE_CNPJ';
        throw error;
      }

      // Gerar slug único
      let slug = this.generateSlug(name);
      const existingSlugCount = await client.query(
        'SELECT COUNT(*) FROM markets WHERE slug LIKE $1',
        [`${slug}%`]
      );
      
      if (parseInt(existingSlugCount.rows[0].count) > 0) {
        slug = `${slug}-${Date.now()}`;
      }

      const sql = `
        INSERT INTO markets (
          name, slug, cnpj, email, phone,
          address_street, address_city, address_state, address_zip_code,
          description, business_name, business_type, website_url, whatsapp,
          address_number, address_complement, address_neighborhood,
          latitude, longitude, operating_hours, category, size_category,
          delivery_available, pickup_available, payment_methods,
          logo_url, cover_image_url, gallery_images,
          created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29
        )
        RETURNING *
      `;

      const values = [
        name.trim(),
        slug,
        cnpj,
        email?.toLowerCase().trim(),
        phone,
        address_street,
        address_city,
        address_state,
        address_zip_code,
        otherData.description,
        otherData.business_name,
        otherData.business_type,
        otherData.website_url,
        otherData.whatsapp,
        otherData.address_number,
        otherData.address_complement,
        otherData.address_neighborhood,
        otherData.latitude,
        otherData.longitude,
        otherData.operating_hours ? JSON.stringify(otherData.operating_hours) : null,
        otherData.category,
        otherData.size_category,
        otherData.delivery_available,
        otherData.pickup_available,
        otherData.payment_methods ? JSON.stringify(otherData.payment_methods) : null,
        otherData.logo_url,
        otherData.cover_image_url,
        otherData.gallery_images ? JSON.stringify(otherData.gallery_images) : null,
        createdBy
      ];

      const result = await client.query(sql, values);
      return new Market(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao criar mercado:', error);
      throw error;
    }
  }

  // Buscar mercado por ID
  static async findById(id) {
    try {
      const sql = `
        SELECT m.*,
               s.plan as subscription_plan,
               s.status as subscription_status,
               s.end_date as subscription_end_date,
               COUNT(DISTINCT mu.user_id) as user_count
        FROM markets m
        LEFT JOIN subscriptions s ON m.id = s.market_id AND s.status = 'active'
        LEFT JOIN market_users mu ON m.id = mu.market_id AND mu.status = 'active'
        WHERE m.id = $1
        GROUP BY m.id, s.plan, s.status, s.end_date
      `;
      
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Market(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar mercado por ID:', error);
      throw error;
    }
  }

  // Buscar mercado por slug
  static async findBySlug(slug) {
    try {
      const sql = `
        SELECT m.*,
               s.plan as subscription_plan,
               s.status as subscription_status,
               s.end_date as subscription_end_date
        FROM markets m
        LEFT JOIN subscriptions s ON m.id = s.market_id AND s.status = 'active'
        WHERE m.slug = $1
      `;
      
      const result = await query(sql, [slug]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Market(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar mercado por slug:', error);
      throw error;
    }
  }

  // Buscar mercado por CNPJ
  static async findByCnpj(cnpj) {
    try {
      const sql = 'SELECT * FROM markets WHERE cnpj = $1';
      const result = await query(sql, [cnpj]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Market(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar mercado por CNPJ:', error);
      throw error;
    }
  }

  // Listar mercados com filtros
  static async findAll(filters = {}) {
    try {
      let sql = `
        SELECT m.*,
               s.plan as subscription_plan,
               s.status as subscription_status,
               s.end_date as subscription_end_date,
               s.next_billing_date,
               COUNT(DISTINCT mu.user_id) as user_count
        FROM markets m
        LEFT JOIN subscriptions s ON m.id = s.market_id AND s.status = 'active'
        LEFT JOIN market_users mu ON m.id = mu.market_id AND mu.status = 'active'
        WHERE 1=1
      `;
      const values = [];
      let paramCount = 0;

      // Aplicar filtros
      if (filters.status) {
        paramCount++;
        sql += ` AND m.status = $${paramCount}`;
        values.push(filters.status);
      }

      if (filters.city) {
        paramCount++;
        sql += ` AND m.address_city ILIKE $${paramCount}`;
        values.push(`%${filters.city}%`);
      }

      if (filters.state) {
        paramCount++;
        sql += ` AND m.address_state = $${paramCount}`;
        values.push(filters.state);
      }

      if (filters.category) {
        paramCount++;
        sql += ` AND m.category = $${paramCount}`;
        values.push(filters.category);
      }

      if (filters.size_category) {
        paramCount++;
        sql += ` AND m.size_category = $${paramCount}`;
        values.push(filters.size_category);
      }

      if (filters.search) {
        paramCount++;
        sql += ` AND (m.search_vector @@ plainto_tsquery('portuguese', $${paramCount}) 
                      OR m.name ILIKE $${paramCount + 1} 
                      OR m.address_city ILIKE $${paramCount + 1})`;
        values.push(filters.search, `%${filters.search}%`);
        paramCount++;
      }

      if (filters.verified !== undefined) {
        paramCount++;
        sql += ` AND m.verified = $${paramCount}`;
        values.push(filters.verified);
      }

      // Filtro por distância (se latitude e longitude fornecidas)
      if (filters.latitude && filters.longitude && filters.radius) {
        paramCount += 3;
        sql += ` AND (
          6371 * acos(
            cos(radians($${paramCount - 2})) * cos(radians(m.latitude)) *
            cos(radians(m.longitude) - radians($${paramCount - 1})) +
            sin(radians($${paramCount - 2})) * sin(radians(m.latitude))
          )
        ) <= $${paramCount}`;
        values.push(filters.latitude, filters.longitude, filters.radius);
      }

      sql += ` GROUP BY m.id, s.plan, s.status, s.end_date, s.next_billing_date`;

      // Ordenação
      switch (filters.sort) {
        case 'name':
          sql += ` ORDER BY m.name ASC`;
          break;
        case 'created_at':
          sql += ` ORDER BY m.created_at DESC`;
          break;
        case 'rating':
          sql += ` ORDER BY m.average_rating DESC`;
          break;
        case 'distance':
          if (filters.latitude && filters.longitude) {
            sql += ` ORDER BY (
              6371 * acos(
                cos(radians(${filters.latitude})) * cos(radians(m.latitude)) *
                cos(radians(m.longitude) - radians(${filters.longitude})) +
                sin(radians(${filters.latitude})) * sin(radians(m.latitude))
              )
            ) ASC`;
          }
          break;
        default:
          sql += ` ORDER BY m.created_at DESC`;
      }

      // Paginação
      if (filters.limit) {
        paramCount++;
        sql += ` LIMIT $${paramCount}`;
        values.push(filters.limit);

        if (filters.offset) {
          paramCount++;
          sql += ` OFFSET $${paramCount}`;
          values.push(filters.offset);
        }
      }

      const result = await query(sql, values);
      return result.rows.map(row => new Market(row));
    } catch (error) {
      console.error('❌ Erro ao listar mercados:', error);
      throw error;
    }
  }

  // Contar mercados com filtros
  static async count(filters = {}) {
    try {
      let sql = `SELECT COUNT(DISTINCT m.id) as total FROM markets m WHERE 1=1`;
      const values = [];
      let paramCount = 0;

      // Aplicar os mesmos filtros do findAll (sem joins desnecessários para contagem)
      if (filters.status) {
        paramCount++;
        sql += ` AND m.status = $${paramCount}`;
        values.push(filters.status);
      }

      if (filters.city) {
        paramCount++;
        sql += ` AND m.address_city ILIKE $${paramCount}`;
        values.push(`%${filters.city}%`);
      }

      if (filters.state) {
        paramCount++;
        sql += ` AND m.address_state = $${paramCount}`;
        values.push(filters.state);
      }

      if (filters.search) {
        paramCount++;
        sql += ` AND (m.search_vector @@ plainto_tsquery('portuguese', $${paramCount}) 
                      OR m.name ILIKE $${paramCount + 1})`;
        values.push(filters.search, `%${filters.search}%`);
        paramCount++;
      }

      const result = await query(sql, values);
      return parseInt(result.rows[0].total);
    } catch (error) {
      console.error('❌ Erro ao contar mercados:', error);
      throw error;
    }
  }

  // Atualizar dados do mercado
  async update(updateData, updatedBy = null) {
    try {
      const allowedFields = [
        'name', 'description', 'cnpj', 'business_name', 'business_type', 'website_url',
        'email', 'phone', 'whatsapp', 'address_street', 'address_number',
        'address_complement', 'address_neighborhood', 'address_city', 'address_state',
        'address_zip_code', 'latitude', 'longitude', 'operating_hours', 'category',
        'size_category', 'delivery_available', 'pickup_available', 'payment_methods',
        'status', 'verified', 'logo_url', 'cover_image_url', 'gallery_images'
      ];

      const updates = [];
      const values = [];
      let paramCount = 0;

      // Construir query dinamicamente
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          paramCount++;
          
          // Campos JSON precisam ser stringified
          if (['operating_hours', 'payment_methods', 'gallery_images'].includes(key)) {
            updates.push(`${key} = $${paramCount}`);
            values.push(JSON.stringify(updateData[key]));
          } else {
            updates.push(`${key} = $${paramCount}`);
            values.push(updateData[key]);
          }
        }
      });

      if (updates.length === 0) {
        throw new Error('Nenhum campo válido para atualização');
      }

      // Atualizar slug se nome foi alterado
      if (updateData.name) {
        paramCount++;
        updates.push(`slug = $${paramCount}`);
        values.push(Market.generateSlug(updateData.name));
      }

      // Adicionar updated_by
      if (updatedBy) {
        paramCount++;
        updates.push(`updated_by = $${paramCount}`);
        values.push(updatedBy);
      }

      // Adicionar WHERE clause
      paramCount++;
      values.push(this.id);

      const sql = `
        UPDATE markets 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Mercado não encontrado');
      }

      // Atualizar objeto atual
      Object.assign(this, result.rows[0]);
      return this;
    } catch (error) {
      console.error('❌ Erro ao atualizar mercado:', error);
      throw error;
    }
  }

  // Atualizar estatísticas do mercado
  async updateStats(stats, updatedBy = null) {
    try {
      const sql = `
        UPDATE markets 
        SET 
          total_products = $1,
          total_categories = $2,
          total_records = $3,
          database_size_mb = $4,
          has_database = $5,
          last_data_sync = CURRENT_TIMESTAMP,
          updated_by = $6
        WHERE id = $7
        RETURNING total_products, total_categories, total_records, database_size_mb, last_data_sync
      `;

      const values = [
        stats.total_products || this.total_products,
        stats.total_categories || this.total_categories,
        stats.total_records || this.total_records,
        stats.database_size_mb || this.database_size_mb,
        stats.total_records > 0,
        updatedBy,
        this.id
      ];

      const result = await query(sql, values);
      
      if (result.rows.length > 0) {
        Object.assign(this, result.rows[0]);
      }

      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro ao atualizar estatísticas:', error);
      throw error;
    }
  }

  // Buscar usuários do mercado
  async getUsers() {
    try {
      const sql = `
        SELECT 
          u.*,
          mu.role as market_role,
          mu.permissions as market_permissions,
          mu.created_at as joined_at
        FROM users u
        JOIN market_users mu ON u.id = mu.user_id
        WHERE mu.market_id = $1 AND mu.status = 'active'
        ORDER BY mu.created_at ASC
      `;

      const result = await query(sql, [this.id]);
      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao buscar usuários do mercado:', error);
      throw error;
    }
  }

  // Adicionar usuário ao mercado
  async addUser(userId, role = 'employee', permissions = null, addedBy = null) {
    try {
      const sql = `
        INSERT INTO market_users (market_id, user_id, role, permissions, created_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (market_id, user_id) 
        DO UPDATE SET 
          role = EXCLUDED.role,
          permissions = EXCLUDED.permissions,
          status = 'active'
        RETURNING *
      `;

      const values = [
        this.id,
        userId,
        role,
        permissions ? JSON.stringify(permissions) : null,
        addedBy
      ];

      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro ao adicionar usuário ao mercado:', error);
      throw error;
    }
  }

  // Adicionar usuário com transação
  async addUserWithTransaction(client, userId, role = 'employee', permissions = null, addedBy = null) {
    try {
      const sql = `
        INSERT INTO market_users (market_id, user_id, role, permissions, created_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (market_id, user_id) 
        DO UPDATE SET 
          role = EXCLUDED.role,
          permissions = EXCLUDED.permissions,
          status = 'active'
        RETURNING *
      `;

      const values = [
        this.id,
        userId,
        role,
        permissions ? JSON.stringify(permissions) : null,
        addedBy
      ];

      const result = await client.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro ao adicionar usuário ao mercado:', error);
      throw error;
    }
  }

  // Adicionar usuário ao mercado com transação atômica
  static async addUserWithTransaction(client, marketId, userId, role = 'employee', permissions = null, addedBy = null) {
    try {
      const sql = `
        INSERT INTO market_users (market_id, user_id, role, permissions, created_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (market_id, user_id) 
        DO UPDATE SET 
          role = EXCLUDED.role,
          permissions = EXCLUDED.permissions,
          status = 'active'
        RETURNING *
      `;

      const values = [
        marketId,
        userId,
        role,
        permissions ? JSON.stringify(permissions) : null,
        addedBy
      ];

      const result = await client.query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro ao adicionar usuário ao mercado:', error);
      throw error;
    }
  }

  // Remover usuário do mercado
  async removeUser(userId, removedBy = null) {
    try {
      const sql = `
        UPDATE market_users 
        SET status = 'inactive'
        WHERE market_id = $1 AND user_id = $2
        RETURNING *
      `;

      const result = await query(sql, [this.id, userId]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro ao remover usuário do mercado:', error);
      throw error;
    }
  }

  // Buscar assinatura ativa
  async getActiveSubscription() {
    try {
      const sql = `
        SELECT * FROM subscriptions 
        WHERE market_id = $1 AND status = 'active'
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await query(sql, [this.id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Erro ao buscar assinatura:', error);
      throw error;
    }
  }

  // Deletar mercado (soft delete)
  async delete(deletedBy = null) {
    try {
      await transaction(async (client) => {
        // Soft delete do mercado
        await client.query(
          'UPDATE markets SET status = $1, updated_by = $2 WHERE id = $3',
          ['inactive', deletedBy, this.id]
        );

        // Remover todos os usuários
        await client.query(
          'UPDATE market_users SET status = $1 WHERE market_id = $2',
          ['inactive', this.id]
        );

        // Cancelar assinaturas ativas
        await client.query(
          'UPDATE subscriptions SET status = $1, updated_by = $2 WHERE market_id = $3 AND status = $4',
          ['cancelled', deletedBy, this.id, 'active']
        );
      });

      this.status = 'inactive';
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar mercado:', error);
      throw error;
    }
  }

  // Converter para JSON
  toJSON() {
    // Parse dos campos JSON
    const data = { ...this };
    
    if (data.operating_hours && typeof data.operating_hours === 'string') {
      try {
        data.operating_hours = JSON.parse(data.operating_hours);
      } catch (e) {
        data.operating_hours = null;
      }
    }

    if (data.payment_methods && typeof data.payment_methods === 'string') {
      try {
        data.payment_methods = JSON.parse(data.payment_methods);
      } catch (e) {
        data.payment_methods = null;
      }
    }

    if (data.gallery_images && typeof data.gallery_images === 'string') {
      try {
        data.gallery_images = JSON.parse(data.gallery_images);
      } catch (e) {
        data.gallery_images = null;
      }
    }

    return data;
  }

  // Converter para JSON público (menos detalhes)
  toPublicJSON() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      category: this.category,
      size_category: this.size_category,
      address_city: this.address_city,
      address_state: this.address_state,
      address_neighborhood: this.address_neighborhood,
      latitude: this.latitude,
      longitude: this.longitude,
      verified: this.verified,
      average_rating: this.average_rating,
      total_reviews: this.total_reviews,
      delivery_available: this.delivery_available,
      pickup_available: this.pickup_available,
      logo_url: this.logo_url,
      cover_image_url: this.cover_image_url,
      operating_hours: this.operating_hours,
      created_at: this.created_at
    };
  }
}

export default Market;