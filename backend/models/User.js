// models/User.js - Model para gerenciamento de usuários
import { query, transaction } from '../config/database.js';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.email = data.email || null;
    this.name = data.name || null;
    this.phone = data.phone || null;
    this.role = data.role || 'cliente';
    this.status = data.status || 'active';
    this.avatar_url = data.avatar_url || null;
    this.date_of_birth = data.date_of_birth || null;
    this.gender = data.gender || null;
    this.address_street = data.address_street || null;
    this.address_city = data.address_city || null;
    this.address_state = data.address_state || null;
    this.address_zip_code = data.address_zip_code || null;
    this.address_country = data.address_country || 'Brasil';
    this.preferred_language = data.preferred_language || 'pt-BR';
    this.timezone = data.timezone || 'America/Sao_Paulo';
    this.email_notifications = data.email_notifications !== false;
    this.push_notifications = data.push_notifications !== false;
    this.email_verified = data.email_verified || false;
    this.two_factor_enabled = data.two_factor_enabled || false;
    this.last_login = data.last_login || null;
    this.last_login_ip = data.last_login_ip || null;
    this.login_count = data.login_count || 0;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  // Criar novo usuário
  static async create(userData, createdBy = null) {
    try {
      const {
        email,
        password,
        name,
        phone,
        role = 'cliente',
        address_city,
        address_state,
        ...otherData
      } = userData;

      // Hash da senha
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Gerar token de verificação de email
      const email_verification_token = uuidv4();
      const email_verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      // Definir status inicial baseado no role
      // Gestores precisam de aprovação, clientes são ativos imediatamente
      const initialStatus = role === 'gestor' ? 'pending_verification' : 'active';

      const sql = `
        INSERT INTO users (
          email, password_hash, name, phone, role, status,
          address_city, address_state,
          email_verification_token, email_verification_expires,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
        email.toLowerCase().trim(),
        password_hash,
        name.trim(),
        phone,
        role,
        initialStatus,
        address_city,
        address_state,
        email_verification_token,
        email_verification_expires,
        createdBy
      ];

      const result = await query(sql, values);
      return new User(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      throw error;
    }
  }

  // Criar usuário com transação
  static async createWithTransaction(client, userData, createdBy = null) {
    try {
      const {
        email,
        password,
        name,
        phone,
        role = 'cliente',
        address_city,
        address_state,
        ...otherData
      } = userData;

      // Hash da senha
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Gerar token de verificação de email
      const email_verification_token = uuidv4();
      const email_verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      // Definir status inicial baseado no role
      // Gestores precisam de aprovação, clientes são ativos imediatamente
      const initialStatus = role === 'gestor' ? 'pending_verification' : 'active';

      const sql = `
        INSERT INTO users (
          email, password_hash, name, phone, role, status,
          address_city, address_state,
          email_verification_token, email_verification_expires,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const values = [
        email.toLowerCase().trim(),
        password_hash,
        name.trim(),
        phone,
        role,
        initialStatus,
        address_city,
        address_state,
        email_verification_token,
        email_verification_expires,
        createdBy
      ];

      const result = await client.query(sql, values);
      return new User(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao criar usuário com transação:', error);
      throw error;
    }
  }

  // Buscar usuário por ID
  static async findById(id) {
    try {
      const sql = 'SELECT * FROM users WHERE id = $1';
      const result = await query(sql, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return new User(result.rows[0]);
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por ID:', error);
      throw error;
    }
  }

  // Buscar usuário por email
  static async findByEmail(email) {
    try {
      const sql = 'SELECT * FROM users WHERE email = $1';
      const result = await query(sql, [email.toLowerCase().trim()]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = new User(result.rows[0]);
      // Adicionar password_hash para verificação
      user.password_hash = result.rows[0].password_hash;
      user.failed_login_attempts = result.rows[0].failed_login_attempts || 0;
      user.account_locked_until = result.rows[0].account_locked_until;
      return user;
    } catch (error) {
      console.error('❌ Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  // Verificar senha
  async verifyPassword(password) {
    try {
      if (!this.password_hash) {
        return false;
      }
      return await bcrypt.compare(password, this.password_hash);
    } catch (error) {
      console.error('❌ Erro ao verificar senha:', error);
      return false;
    }
  }

  // Verificar se conta está bloqueada
  async isAccountLocked() {
    if (!this.account_locked_until) {
      return false;
    }
    
    const now = new Date();
    const lockedUntil = new Date(this.account_locked_until);
    
    if (now < lockedUntil) {
      return true;
    }
    
    // Se o período de bloqueio expirou, limpar
    await query(
      'UPDATE users SET account_locked_until = NULL, failed_login_attempts = 0 WHERE id = $1',
      [this.id]
    );
    
    return false;
  }

  // Registrar tentativa de login falhada
  async registerFailedLogin() {
    try {
      const maxAttempts = 5;
      const lockDuration = 15 * 60 * 1000; // 15 minutos
      
      const newAttempts = (this.failed_login_attempts || 0) + 1;
      
      let sql;
      let values;
      
      if (newAttempts >= maxAttempts) {
        // Bloquear conta
        const lockUntil = new Date(Date.now() + lockDuration);
        sql = `
          UPDATE users 
          SET failed_login_attempts = $1, account_locked_until = $2 
          WHERE id = $3
        `;
        values = [newAttempts, lockUntil, this.id];
      } else {
        sql = `
          UPDATE users 
          SET failed_login_attempts = $1 
          WHERE id = $2
        `;
        values = [newAttempts, this.id];
      }
      
      await query(sql, values);
      this.failed_login_attempts = newAttempts;
    } catch (error) {
      console.error('❌ Erro ao registrar login falhado:', error);
    }
  }

  // Registrar login bem-sucedido
  async registerLogin(ipAddress, userAgent) {
    try {
      const sql = `
        UPDATE users 
        SET 
          last_login = CURRENT_TIMESTAMP,
          last_login_ip = $1,
          login_count = login_count + 1,
          failed_login_attempts = 0,
          account_locked_until = NULL
        WHERE id = $2
      `;
      
      await query(sql, [ipAddress, this.id]);
      this.failed_login_attempts = 0;
      this.account_locked_until = null;
    } catch (error) {
      console.error('❌ Erro ao registrar login:', error);
    }
  }

  // Listar usuários com filtros
  static async findAll(filters = {}) {
    try {
      let sql = `
        SELECT u.*, 
               COUNT(DISTINCT mu.market_id) as market_count
        FROM users u
        LEFT JOIN market_users mu ON u.id = mu.user_id AND mu.status = 'active'
        WHERE 1=1
      `;
      const values = [];
      let paramCount = 0;

      // Aplicar filtros
      if (filters.role) {
        paramCount++;
        sql += ` AND u.role = $${paramCount}`;
        values.push(filters.role);
      }

      if (filters.status) {
        paramCount++;
        sql += ` AND u.status = $${paramCount}`;
        values.push(filters.status);
      }

      if (filters.search) {
        paramCount++;
        sql += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
        values.push(`%${filters.search}%`);
      }

      if (filters.city) {
        paramCount++;
        sql += ` AND u.address_city ILIKE $${paramCount}`;
        values.push(`%${filters.city}%`);
      }

      sql += ` GROUP BY u.id ORDER BY u.created_at DESC`;

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
      return result.rows.map(row => new User(row));
    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error);
      throw error;
    }
  }

  // Verificar senha
  async verifyPassword(password) {
    try {
      if (!this.password_hash) {
        return false;
      }
      return await bcrypt.compare(password, this.password_hash);
    } catch (error) {
      console.error('❌ Erro ao verificar senha:', error);
      return false;
    }
  }

  // Atualizar dados do usuário
  async update(updateData, updatedBy = null) {
    try {
      const allowedFields = [
        'name', 'phone', 'role', 'status', 'avatar_url', 'date_of_birth', 'gender',
        'address_street', 'address_city', 'address_state', 'address_zip_code',
        'preferred_language', 'timezone', 'email_notifications', 'push_notifications',
        'email_verified', 'two_factor_enabled'
      ];

      const updates = [];
      const values = [];
      let paramCount = 0;

      // Construir query dinamicamente
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
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await query(sql, values);
      
      if (result.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      // Atualizar objeto atual
      Object.assign(this, result.rows[0]);
      return this;
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  // Atualizar senha
  async updatePassword(newPassword, updatedBy = null) {
    try {
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);

      const sql = `
        UPDATE users 
        SET password_hash = $1, updated_by = $2
        WHERE id = $3
        RETURNING id, email, name
      `;

      const result = await query(sql, [password_hash, updatedBy, this.id]);
      
      if (result.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro ao atualizar senha:', error);
      throw error;
    }
  }

  // Registrar login
  async registerLogin(ipAddress = null, userAgent = null) {
    try {
      const sql = `
        UPDATE users 
        SET 
          last_login = CURRENT_TIMESTAMP,
          last_login_ip = $1,
          login_count = login_count + 1,
          failed_login_attempts = 0,
          account_locked_until = NULL
        WHERE id = $2
        RETURNING last_login, login_count
      `;

      const result = await query(sql, [ipAddress, this.id]);
      
      if (result.rows.length > 0) {
        this.last_login = result.rows[0].last_login;
        this.login_count = result.rows[0].login_count;
      }

      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro ao registrar login:', error);
      throw error;
    }
  }

  // Registrar tentativa de login falhada
  async registerFailedLogin() {
    try {
      const sql = `
        UPDATE users 
        SET 
          failed_login_attempts = failed_login_attempts + 1,
          account_locked_until = CASE 
            WHEN failed_login_attempts >= 4 THEN CURRENT_TIMESTAMP + INTERVAL '30 minutes'
            ELSE account_locked_until
          END
        WHERE id = $1
        RETURNING failed_login_attempts, account_locked_until
      `;

      const result = await query(sql, [this.id]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erro ao registrar login falhado:', error);
      throw error;
    }
  }

  // Verificar se conta está bloqueada
  async isAccountLocked() {
    try {
      const sql = `
        SELECT account_locked_until > CURRENT_TIMESTAMP as is_locked,
               account_locked_until
        FROM users 
        WHERE id = $1
      `;

      const result = await query(sql, [this.id]);
      return result.rows[0]?.is_locked || false;
    } catch (error) {
      console.error('❌ Erro ao verificar bloqueio da conta:', error);
      return false;
    }
  }

  // Buscar mercados do usuário
  async getMarkets() {
    try {
      const sql = `
        SELECT 
          m.*,
          mu.role as user_role,
          mu.permissions as user_permissions,
          s.plan as subscription_plan,
          s.status as subscription_status
        FROM markets m
        JOIN market_users mu ON m.id = mu.market_id
        LEFT JOIN subscriptions s ON m.id = s.market_id AND s.status = 'active'
        WHERE mu.user_id = $1 AND mu.status = 'active'
        ORDER BY m.name
      `;

      const result = await query(sql, [this.id]);
      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao buscar mercados do usuário:', error);
      throw error;
    }
  }

  // Verificar permissão em mercado
  async hasMarketPermission(marketId, permission = 'view') {
    try {
      // Admin tem acesso a tudo
      if (this.role === 'admin') {
        return true;
      }

      const sql = `
        SELECT mu.role, mu.permissions
        FROM market_users mu
        WHERE mu.user_id = $1 AND mu.market_id = $2 AND mu.status = 'active'
      `;

      const result = await query(sql, [this.id, marketId]);
      
      if (result.rows.length === 0) {
        return false;
      }

      const { role, permissions } = result.rows[0];

      // Owner e manager têm todas as permissões
      if (role === 'owner' || role === 'manager') {
        return true;
      }

      // Verificar permissões específicas
      if (permissions && typeof permissions === 'object') {
        return permissions[permission] === true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro ao verificar permissão:', error);
      return false;
    }
  }

  // Verificar se usuário tem acesso a qualquer mercado
  async hasAnyMarketAccess() {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM market_users mu
        WHERE mu.user_id = $1 AND mu.status = 'active'
      `;

      const result = await query(sql, [this.id]);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('❌ Erro ao verificar acesso a mercados:', error);
      return false;
    }
  }

  // Deletar usuário (soft delete)
  async delete(deletedBy = null) {
    try {
      await transaction(async (client) => {
        // Soft delete do usuário
        await client.query(
          'UPDATE users SET status = $1, updated_by = $2 WHERE id = $3',
          ['inactive', deletedBy, this.id]
        );

        // Remover de todos os mercados
        await client.query(
          'UPDATE market_users SET status = $1 WHERE user_id = $2',
          ['inactive', this.id]
        );

        // Invalidar todas as sessões
        await client.query(
          'UPDATE user_sessions SET is_active = false WHERE user_id = $1',
          [this.id]
        );
      });

      this.status = 'inactive';
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar usuário:', error);
      throw error;
    }
  }

  // Converter para JSON (remover dados sensíveis)
  toJSON() {
    const {
      password_hash,
      email_verification_token,
      password_reset_token,
      two_factor_secret,
      ...publicData
    } = this;

    return publicData;
  }

  // Converter para JSON com dados públicos mínimos
  toPublicJSON() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      avatar_url: this.avatar_url,
      created_at: this.created_at
    };
  }
}

export default User;