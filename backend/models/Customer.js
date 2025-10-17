// models/Customer.js - Model para gerenciamento de clientes
import { query, transaction } from '../config/database.js';

export class Customer {
  constructor(data = {}) {
    this.id = data.id || null;
    this.market_id = data.market_id || null;
    this.name = data.name || null;
    this.email = data.email || null;
    this.phone = data.phone || null;
    this.cpf = data.cpf || null;
    this.address_street = data.address_street || null;
    this.address_number = data.address_number || null;
    this.address_complement = data.address_complement || null;
    this.address_neighborhood = data.address_neighborhood || null;
    this.address_city = data.address_city || null;
    this.address_state = data.address_state || null;
    this.address_zip_code = data.address_zip_code || null;
    this.preferred_payment_method = data.preferred_payment_method || null;
    this.accepts_marketing = data.accepts_marketing !== false;
    this.loyalty_points = data.loyalty_points || 0;
    this.loyalty_tier = data.loyalty_tier || 'bronze';
    this.total_purchases = data.total_purchases || 0;
    this.total_spent = data.total_spent || 0;
    this.last_purchase_date = data.last_purchase_date || null;
    this.average_ticket = data.average_ticket || 0;
    this.status = data.status || 'active';
    this.notes = data.notes || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.created_by = data.created_by || null;
    this.updated_by = data.updated_by || null;
  }

  // Criar novo cliente
  static async create(customerData, createdBy = null) {
    try {
      const {
        market_id,
        name,
        email,
        phone,
        cpf,
        ...otherData
      } = customerData;

      const sql = `
        INSERT INTO customers (
          market_id, name, email, phone, cpf,
          address_street, address_number, address_complement, address_neighborhood,
          address_city, address_state, address_zip_code,
          preferred_payment_method, accepts_marketing,
          notes, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        )
        RETURNING *
      `;

      const values = [
        market_id,
        name,
        email?.toLowerCase().trim(),
        phone,
        cpf,
        otherData.address_street,
        otherData.address_number,
        otherData.address_complement,
        otherData.address_neighborhood,
        otherData.address_city,
        otherData.address_state,
        otherData.address_zip_code,
        otherData.preferred_payment_method,
        otherData.accepts_marketing,
        otherData.notes,
        createdBy
      ];

      const result = await query(sql, values);
      return new Customer(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      throw error;
    }
  }

  // Buscar cliente por ID
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM customers WHERE id = $1';
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Customer(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar cliente por ID:', error);
      throw error;
    }
  }

  // Buscar cliente por email e mercado
  static async findByEmail(marketId, email) {
    try {
      const sql = 'SELECT * FROM customers WHERE market_id = $1 AND email = $2';
      const result = await query(sql, [marketId, email.toLowerCase().trim()]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Customer(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar cliente por email:', error);
      throw error;
    }
  }

  // Buscar cliente por CPF e mercado
  static async findByCpf(marketId, cpf) {
    try {
      const sql = 'SELECT * FROM customers WHERE market_id = $1 AND cpf = $2';
      const result = await query(sql, [marketId, cpf]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new Customer(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar cliente por CPF:', error);
      throw error;
    }
  }

  // Listar clientes de um mercado
  static async findByMarket(marketId, filters = {}) {
    try {
      let sql = `
        SELECT c.*,
               COUNT(DISTINCT ct.id) as transaction_count,
               COALESCE(SUM(ct.loyalty_points_earned), 0) as total_loyalty_earned
        FROM customers c
        LEFT JOIN customer_transactions ct ON c.id = ct.customer_id AND ct.status = 'completed'
        WHERE c.market_id = $1
      `;
      const values = [marketId];
      let paramCount = 1;

      // Filtros opcionais
      if (filters.status) {
        paramCount++;
        sql += ` AND c.status = $${paramCount}`;
        values.push(filters.status);
      }

      if (filters.loyalty_tier) {
        paramCount++;
        sql += ` AND c.loyalty_tier = $${paramCount}`;
        values.push(filters.loyalty_tier);
      }

      if (filters.search) {
        paramCount++;
        sql += ` AND (c.name ILIKE $${paramCount} OR c.email ILIKE $${paramCount} OR c.phone ILIKE $${paramCount})`;
        values.push(`%${filters.search}%`);
      }

      sql += ` GROUP BY c.id`;

      // Ordenação
      switch (filters.sort) {
        case 'name':
          sql += ` ORDER BY c.name ASC`;
          break;
        case 'spending':
          sql += ` ORDER BY c.total_spent DESC`;
          break;
        case 'purchases':
          sql += ` ORDER BY c.total_purchases DESC`;
          break;
        case 'recent':
          sql += ` ORDER BY c.last_purchase_date DESC NULLS LAST`;
          break;
        default:
          sql += ` ORDER BY c.created_at DESC`;
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
      return result.rows.map(row => new Customer(row));
    } catch (error) {
      console.error('❌ Erro ao listar clientes:', error);
      throw error;
    }
  }

  // Contar clientes de um mercado
  static async countByMarket(marketId, filters = {}) {
    try {
      let sql = `SELECT COUNT(*) FROM customers WHERE market_id = $1`;
      const values = [marketId];
      let paramCount = 1;

      if (filters.status) {
        paramCount++;
        sql += ` AND status = $${paramCount}`;
        values.push(filters.status);
      }

      if (filters.loyalty_tier) {
        paramCount++;
        sql += ` AND loyalty_tier = $${paramCount}`;
        values.push(filters.loyalty_tier);
      }

      const result = await query(sql, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Erro ao contar clientes:', error);
      throw error;
    }
  }

  // Atualizar dados do cliente
  async update(updateData, updatedBy = null) {
    try {
      const allowedFields = [
        'name', 'email', 'phone', 'cpf',
        'address_street', 'address_number', 'address_complement', 'address_neighborhood',
        'address_city', 'address_state', 'address_zip_code',
        'preferred_payment_method', 'accepts_marketing',
        'loyalty_tier', 'status', 'notes'
      ];

      const updates = [];
      const values = [];
      let paramCount = 0;

      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
          paramCount++;
          updates.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
        }
      });

      if (updates.length === 0) {
        throw new Error('Nenhum campo válido para atualização');
      }

      if (updatedBy) {
        paramCount++;
        updates.push(`updated_by = $${paramCount}`);
        values.push(updatedBy);
      }

      paramCount++;
      values.push(this.id);

      const sql = `
        UPDATE customers 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Cliente não encontrado');
      }

      Object.assign(this, result.rows[0]);
      return this;
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      throw error;
    }
  }

  // Adicionar pontos de fidelidade
  async addLoyaltyPoints(points) {
    try {
      const sql = `
        UPDATE customers 
        SET loyalty_points = loyalty_points + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING loyalty_points
      `;

      const result = await query(sql, [points, this.id]);
      this.loyalty_points = result.rows[0].loyalty_points;

      // Atualizar tier baseado nos pontos
      await this.updateLoyaltyTier();

      return this.loyalty_points;
    } catch (error) {
      console.error('❌ Erro ao adicionar pontos de fidelidade:', error);
      throw error;
    }
  }

  // Atualizar tier de fidelidade baseado nos pontos
  async updateLoyaltyTier() {
    try {
      let newTier = 'bronze';
      
      if (this.loyalty_points >= 10000) {
        newTier = 'platinum';
      } else if (this.loyalty_points >= 5000) {
        newTier = 'gold';
      } else if (this.loyalty_points >= 1000) {
        newTier = 'silver';
      }

      if (newTier !== this.loyalty_tier) {
        const sql = `
          UPDATE customers 
          SET loyalty_tier = $1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `;
        
        await query(sql, [newTier, this.id]);
        this.loyalty_tier = newTier;
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar tier de fidelidade:', error);
      throw error;
    }
  }

  // Buscar histórico de transações
  async getTransactions(filters = {}) {
    try {
      let sql = `
        SELECT ct.*,
               pp.name as payment_plan_name
        FROM customer_transactions ct
        LEFT JOIN payment_plans pp ON ct.payment_plan_id = pp.id
        WHERE ct.customer_id = $1
      `;
      const values = [this.id];
      let paramCount = 1;

      if (filters.status) {
        paramCount++;
        sql += ` AND ct.status = $${paramCount}`;
        values.push(filters.status);
      }

      if (filters.type) {
        paramCount++;
        sql += ` AND ct.transaction_type = $${paramCount}`;
        values.push(filters.type);
      }

      sql += ` ORDER BY ct.transaction_date DESC`;

      if (filters.limit) {
        paramCount++;
        sql += ` LIMIT $${paramCount}`;
        values.push(filters.limit);
      }

      const result = await query(sql, values);
      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao buscar transações:', error);
      throw error;
    }
  }

  // Deletar cliente (soft delete)
  async delete(deletedBy = null) {
    try {
      const sql = `
        UPDATE customers 
        SET status = 'inactive',
            updated_by = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;

      await query(sql, [deletedBy, this.id]);
      this.status = 'inactive';
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar cliente:', error);
      throw error;
    }
  }

  // Converter para JSON
  toJSON() {
    return {
      id: this.id,
      market_id: this.market_id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      cpf: this.cpf,
      address: {
        street: this.address_street,
        number: this.address_number,
        complement: this.address_complement,
        neighborhood: this.address_neighborhood,
        city: this.address_city,
        state: this.address_state,
        zip_code: this.address_zip_code
      },
      preferred_payment_method: this.preferred_payment_method,
      accepts_marketing: this.accepts_marketing,
      loyalty: {
        points: this.loyalty_points,
        tier: this.loyalty_tier
      },
      stats: {
        total_purchases: this.total_purchases,
        total_spent: parseFloat(this.total_spent),
        average_ticket: parseFloat(this.average_ticket),
        last_purchase_date: this.last_purchase_date
      },
      status: this.status,
      notes: this.notes,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default Customer;

