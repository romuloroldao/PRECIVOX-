// models/PaymentPlan.js - Model para gerenciamento de planos de pagamento
import { query } from '../config/database.js';

export class PaymentPlan {
  constructor(data = {}) {
    this.id = data.id || null;
    this.market_id = data.market_id || null;
    this.name = data.name || null;
    this.description = data.description || null;
    this.plan_type = data.plan_type || 'installment';
    this.max_installments = data.max_installments || 1;
    this.min_purchase_amount = data.min_purchase_amount || 0;
    this.interest_rate = data.interest_rate || 0;
    this.billing_frequency = data.billing_frequency || null;
    this.subscription_price = data.subscription_price || null;
    this.discount_percentage = data.discount_percentage || 0;
    this.cashback_percentage = data.cashback_percentage || 0;
    this.loyalty_points_multiplier = data.loyalty_points_multiplier || 1;
    this.min_credit_score = data.min_credit_score || null;
    this.requires_approval = data.requires_approval || false;
    this.available_for_new_customers = data.available_for_new_customers !== false;
    this.valid_from = data.valid_from || null;
    this.valid_until = data.valid_until || null;
    this.is_active = data.is_active !== false;
    this.is_default = data.is_default || false;
    this.display_order = data.display_order || 0;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.created_by = data.created_by || null;
    this.updated_by = data.updated_by || null;
  }

  // Criar novo plano de pagamento
  static async create(planData, createdBy = null) {
    try {
      const {
        market_id,
        name,
        description,
        plan_type,
        ...otherData
      } = planData;

      const sql = `
        INSERT INTO payment_plans (
          market_id, name, description, plan_type,
          max_installments, min_purchase_amount, interest_rate,
          billing_frequency, subscription_price,
          discount_percentage, cashback_percentage, loyalty_points_multiplier,
          min_credit_score, requires_approval, available_for_new_customers,
          valid_from, valid_until, is_active, is_default, display_order,
          created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )
        RETURNING *
      `;

      const values = [
        market_id,
        name,
        description,
        plan_type,
        otherData.max_installments || 1,
        otherData.min_purchase_amount || 0,
        otherData.interest_rate || 0,
        otherData.billing_frequency,
        otherData.subscription_price,
        otherData.discount_percentage || 0,
        otherData.cashback_percentage || 0,
        otherData.loyalty_points_multiplier || 1,
        otherData.min_credit_score,
        otherData.requires_approval || false,
        otherData.available_for_new_customers !== false,
        otherData.valid_from,
        otherData.valid_until,
        otherData.is_active !== false,
        otherData.is_default || false,
        otherData.display_order || 0,
        createdBy
      ];

      const result = await query(sql, values);
      return new PaymentPlan(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao criar plano de pagamento:', error);
      throw error;
    }
  }

  // Buscar plano por ID
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM payment_plans WHERE id = $1';
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new PaymentPlan(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar plano por ID:', error);
      throw error;
    }
  }

  // Listar planos de um mercado
  static async findByMarket(marketId, filters = {}) {
    try {
      let sql = `
        SELECT pp.*,
               COUNT(DISTINCT ct.id) as usage_count
        FROM payment_plans pp
        LEFT JOIN customer_transactions ct ON pp.id = ct.payment_plan_id
        WHERE pp.market_id = $1
      `;
      const values = [marketId];
      let paramCount = 1;

      // Filtros opcionais
      if (filters.plan_type) {
        paramCount++;
        sql += ` AND pp.plan_type = $${paramCount}`;
        values.push(filters.plan_type);
      }

      if (filters.active_only) {
        sql += ` AND pp.is_active = true`;
        sql += ` AND (pp.valid_until IS NULL OR pp.valid_until >= CURRENT_DATE)`;
      }

      sql += ` GROUP BY pp.id`;
      sql += ` ORDER BY pp.is_default DESC, pp.display_order ASC, pp.name ASC`;

      const result = await query(sql, values);
      return result.rows.map(row => new PaymentPlan(row));
    } catch (error) {
      console.error('❌ Erro ao listar planos:', error);
      throw error;
    }
  }

  // Buscar plano padrão de um mercado
  static async findDefaultByMarket(marketId) {
    try {
      const sql = `
        SELECT * FROM payment_plans 
        WHERE market_id = $1 
        AND is_default = true 
        AND is_active = true
        LIMIT 1
      `;
      const result = await query(sql, [marketId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new PaymentPlan(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar plano padrão:', error);
      throw error;
    }
  }

  // Atualizar plano
  async update(updateData, updatedBy = null) {
    try {
      const allowedFields = [
        'name', 'description', 'plan_type',
        'max_installments', 'min_purchase_amount', 'interest_rate',
        'billing_frequency', 'subscription_price',
        'discount_percentage', 'cashback_percentage', 'loyalty_points_multiplier',
        'min_credit_score', 'requires_approval', 'available_for_new_customers',
        'valid_from', 'valid_until', 'is_active', 'is_default', 'display_order'
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
        UPDATE payment_plans 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Plano não encontrado');
      }

      Object.assign(this, result.rows[0]);
      return this;
    } catch (error) {
      console.error('❌ Erro ao atualizar plano:', error);
      throw error;
    }
  }

  // Calcular valor total com juros
  calculateTotalWithInterest(amount, installments) {
    if (installments <= 1 || this.interest_rate === 0) {
      return amount;
    }

    // Cálculo de juros compostos
    const monthlyRate = this.interest_rate / 100;
    const totalWithInterest = amount * Math.pow(1 + monthlyRate, installments);
    
    return parseFloat(totalWithInterest.toFixed(2));
  }

  // Calcular valor da parcela
  calculateInstallmentValue(amount, installments) {
    const total = this.calculateTotalWithInterest(amount, installments);
    return parseFloat((total / installments).toFixed(2));
  }

  // Aplicar desconto
  applyDiscount(amount) {
    if (this.discount_percentage === 0) {
      return amount;
    }

    const discountAmount = amount * (this.discount_percentage / 100);
    return parseFloat((amount - discountAmount).toFixed(2));
  }

  // Calcular cashback
  calculateCashback(amount) {
    if (this.cashback_percentage === 0) {
      return 0;
    }

    return parseFloat((amount * (this.cashback_percentage / 100)).toFixed(2));
  }

  // Calcular pontos de fidelidade
  calculateLoyaltyPoints(amount) {
    // Regra: 1 ponto por real gasto, multiplicado pelo multiplicador do plano
    const basePoints = Math.floor(amount);
    return Math.floor(basePoints * this.loyalty_points_multiplier);
  }

  // Validar se plano está válido
  isValid() {
    if (!this.is_active) {
      return { valid: false, reason: 'Plano inativo' };
    }

    const now = new Date();

    if (this.valid_from) {
      const validFrom = new Date(this.valid_from);
      if (now < validFrom) {
        return { valid: false, reason: 'Plano ainda não está disponível' };
      }
    }

    if (this.valid_until) {
      const validUntil = new Date(this.valid_until);
      if (now > validUntil) {
        return { valid: false, reason: 'Plano expirado' };
      }
    }

    return { valid: true };
  }

  // Verificar se valor mínimo é atendido
  meetsMinimumAmount(amount) {
    return amount >= this.min_purchase_amount;
  }

  // Deletar plano (soft delete)
  async delete(deletedBy = null) {
    try {
      const sql = `
        UPDATE payment_plans 
        SET is_active = false,
            updated_by = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;

      await query(sql, [deletedBy, this.id]);
      this.is_active = false;
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar plano:', error);
      throw error;
    }
  }

  // Converter para JSON
  toJSON() {
    return {
      id: this.id,
      market_id: this.market_id,
      name: this.name,
      description: this.description,
      plan_type: this.plan_type,
      installment_config: {
        max_installments: this.max_installments,
        interest_rate: parseFloat(this.interest_rate),
        min_purchase_amount: parseFloat(this.min_purchase_amount)
      },
      subscription_config: {
        billing_frequency: this.billing_frequency,
        subscription_price: this.subscription_price ? parseFloat(this.subscription_price) : null
      },
      benefits: {
        discount_percentage: parseFloat(this.discount_percentage),
        cashback_percentage: parseFloat(this.cashback_percentage),
        loyalty_points_multiplier: parseFloat(this.loyalty_points_multiplier)
      },
      requirements: {
        min_credit_score: this.min_credit_score,
        requires_approval: this.requires_approval,
        available_for_new_customers: this.available_for_new_customers
      },
      validity: {
        valid_from: this.valid_from,
        valid_until: this.valid_until
      },
      is_active: this.is_active,
      is_default: this.is_default,
      display_order: this.display_order,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default PaymentPlan;

