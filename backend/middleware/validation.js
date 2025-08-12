// middleware/validation.js - Middleware de validação usando Joi
import Joi from 'joi';

// Schemas de validação
export const schemas = {
  // Validação de usuário
  userRegister: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email deve ter um formato válido',
      'any.required': 'Email é obrigatório'
    }),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])')).required().messages({
      'string.min': 'Senha deve ter pelo menos 8 caracteres',
      'string.pattern.base': 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número',
      'any.required': 'Senha é obrigatória'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Confirmação de senha deve ser igual à senha',
      'any.required': 'Confirmação de senha é obrigatória'
    }),
    name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres',
      'any.required': 'Nome é obrigatório'
    }),
    phone: Joi.string().pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/).messages({
      'string.pattern.base': 'Telefone deve estar no formato (11) 99999-9999'
    }),
    role: Joi.string().valid('cliente', 'gestor', 'admin').default('cliente'),
    address_city: Joi.string().max(100),
    address_state: Joi.string().length(2).uppercase(),
    address_zip_code: Joi.string().pattern(/^\d{5}-?\d{3}$/),
    terms_accepted: Joi.boolean().valid(true).required().messages({
      'any.only': 'Você deve aceitar os termos de uso'
    })
  }),

  userLogin: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email deve ter um formato válido',
      'any.required': 'Email é obrigatório'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Senha é obrigatória'
    }),
    remember_me: Joi.boolean().default(false)
  }),

  userUpdate: Joi.object({
    name: Joi.string().min(2).max(100),
    phone: Joi.string().pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/),
    date_of_birth: Joi.date().max('now'),
    gender: Joi.string().valid('masculino', 'feminino', 'outro', 'prefiro_nao_dizer'),
    address_street: Joi.string().max(200),
    address_city: Joi.string().max(100),
    address_state: Joi.string().length(2).uppercase(),
    address_zip_code: Joi.string().pattern(/^\d{5}-?\d{3}$/),
    preferred_language: Joi.string().valid('pt-BR', 'en-US', 'es-ES'),
    timezone: Joi.string(),
    email_notifications: Joi.boolean(),
    push_notifications: Joi.boolean()
  }),

  passwordChange: Joi.object({
    current_password: Joi.string().required().messages({
      'any.required': 'Senha atual é obrigatória'
    }),
    new_password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])')).required().messages({
      'string.min': 'Nova senha deve ter pelo menos 8 caracteres',
      'string.pattern.base': 'Nova senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número',
      'any.required': 'Nova senha é obrigatória'
    }),
    confirm_new_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
      'any.only': 'Confirmação de nova senha deve ser igual à nova senha'
    })
  }),

  // Validação de mercado com gestor
  marketCreate: Joi.object({
    name: Joi.string().min(2).max(255).required().messages({
      'string.min': 'Nome do mercado deve ter pelo menos 2 caracteres',
      'string.max': 'Nome do mercado deve ter no máximo 255 caracteres',
      'any.required': 'Nome do mercado é obrigatório'
    }),
    description: Joi.string().max(1000),
    cnpj: Joi.string().pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/).required().messages({
      'string.pattern.base': 'CNPJ deve estar no formato 00.000.000/0000-00',
      'any.required': 'CNPJ é obrigatório'
    }),
    business_name: Joi.string().max(255),
    business_type: Joi.string().max(100),
    website_url: Joi.string().uri(),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/),
    whatsapp: Joi.string().pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/),
    address_street: Joi.string().max(200).required().messages({
      'any.required': 'Endereço é obrigatório'
    }),
    address_number: Joi.string().max(20),
    address_complement: Joi.string().max(100),
    address_neighborhood: Joi.string().max(100),
    address_city: Joi.string().max(100).required().messages({
      'any.required': 'Cidade é obrigatória'
    }),
    address_state: Joi.string().length(2).uppercase().required().messages({
      'string.length': 'Estado deve ter 2 caracteres',
      'any.required': 'Estado é obrigatório'
    }),
    address_zip_code: Joi.string().pattern(/^\d{5}-?\d{3}$/).required().messages({
      'string.pattern.base': 'CEP deve estar no formato 00000-000',
      'any.required': 'CEP é obrigatório'
    }),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    category: Joi.string().valid('Supermercado', 'Mercado', 'Atacadista', 'Conveniência', 'Padaria', 'Açougue', 'Hortifruti', 'Farmácia'),
    size_category: Joi.string().valid('small', 'medium', 'large', 'supermarket', 'hypermarket'),
    delivery_available: Joi.boolean().default(false),
    pickup_available: Joi.boolean().default(true),
    operating_hours: Joi.object().pattern(
      Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      Joi.object({
        open: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        close: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        closed: Joi.boolean()
      })
    ),
    payment_methods: Joi.array().items(
      Joi.string().valid('cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'food_voucher')
    ),
    
    // Validação do gestor
    manager: Joi.object({
      name: Joi.string().min(2).max(255).required().messages({
        'any.required': 'Nome do gestor é obrigatório'
      }),
      email: Joi.string().email().required().messages({
        'any.required': 'Email do gestor é obrigatório',
        'string.email': 'Email inválido'
      }),
      phone: Joi.string().pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/).required().messages({
        'any.required': 'Telefone do gestor é obrigatório',
        'string.pattern.base': 'Telefone deve estar no formato (11) 99999-9999'
      })
    }).required().messages({
      'any.required': 'Dados do gestor são obrigatórios'
    })
  }),

  marketUpdate: Joi.object({
    name: Joi.string().min(2).max(255),
    description: Joi.string().max(1000),
    cnpj: Joi.string().pattern(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/),
    business_name: Joi.string().max(255),
    business_type: Joi.string().max(100),
    website_url: Joi.string().uri(),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/),
    whatsapp: Joi.string().pattern(/^\(\d{2}\)\s\d{4,5}-\d{4}$/),
    address_street: Joi.string().max(200),
    address_number: Joi.string().max(20),
    address_complement: Joi.string().max(100),
    address_neighborhood: Joi.string().max(100),
    address_city: Joi.string().max(100),
    address_state: Joi.string().length(2).uppercase(),
    address_zip_code: Joi.string().pattern(/^\d{5}-?\d{3}$/),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    category: Joi.string().valid('Supermercado', 'Mercado', 'Atacadista', 'Conveniência', 'Padaria', 'Açougue', 'Hortifruti', 'Farmácia'),
    size_category: Joi.string().valid('small', 'medium', 'large', 'supermarket', 'hypermarket'),
    delivery_available: Joi.boolean(),
    pickup_available: Joi.boolean(),
    status: Joi.string().valid('active', 'pending', 'suspended', 'inactive'),
    verified: Joi.boolean(),
    operating_hours: Joi.object().pattern(
      Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      Joi.object({
        open: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        close: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        closed: Joi.boolean()
      })
    ),
    payment_methods: Joi.array().items(
      Joi.string().valid('cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'food_voucher')
    )
  }),

  // Validação de query parameters
  listUsers: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    role: Joi.string().valid('cliente', 'gestor', 'admin'),
    status: Joi.string().valid('active', 'inactive', 'suspended', 'pending_verification'),
    search: Joi.string().max(100),
    city: Joi.string().max(100),
    sort: Joi.string().valid('name', 'email', 'created_at', 'last_login').default('created_at')
  }),

  listMarkets: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('active', 'pending', 'suspended', 'inactive'),
    city: Joi.string().max(100),
    state: Joi.string().length(2).uppercase(),
    category: Joi.string().valid('Supermercado', 'Mercado', 'Atacadista', 'Conveniência', 'Padaria', 'Açougue', 'Hortifruti', 'Farmácia'),
    size_category: Joi.string().valid('small', 'medium', 'large', 'supermarket', 'hypermarket'),
    search: Joi.string().max(100),
    verified: Joi.boolean(),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    radius: Joi.number().min(0.1).max(100), // km
    sort: Joi.string().valid('name', 'created_at', 'rating', 'distance').default('created_at')
  }),

  // Validação de ID UUID
  uuidParam: Joi.object({
    id: Joi.string().uuid().required().messages({
      'string.uuid': 'ID deve ser um UUID válido',
      'any.required': 'ID é obrigatório'
    })
  }),

  // Validação de adição de usuário ao mercado
  addUserToMarket: Joi.object({
    user_id: Joi.string().uuid().required(),
    role: Joi.string().valid('owner', 'manager', 'employee', 'viewer').default('employee'),
    permissions: Joi.object().pattern(
      Joi.string(),
      Joi.boolean()
    )
  })
};

// Middleware genérico de validação
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Retorna todos os erros
      stripUnknown: true, // Remove campos não definidos no schema
      convert: true // Converte tipos automaticamente
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        error: 'Dados de entrada inválidos',
        details: errors
      });
    }

    // Substituir os dados validados
    req[property] = value;
    next();
  };
};

// Middleware específicos para validações comuns
export const validateUserRegister = validate(schemas.userRegister);
export const validateUserLogin = validate(schemas.userLogin);
export const validateUserUpdate = validate(schemas.userUpdate);
export const validatePasswordChange = validate(schemas.passwordChange);
export const validateMarketCreate = validate(schemas.marketCreate);
export const validateMarketUpdate = validate(schemas.marketUpdate);
export const validateListUsers = validate(schemas.listUsers, 'query');
export const validateListMarkets = validate(schemas.listMarkets, 'query');
export const validateUuidParam = validate(schemas.uuidParam, 'params');
export const validateAddUserToMarket = validate(schemas.addUserToMarket);

// Middleware para sanitizar dados de entrada
export const sanitizeInput = (req, res, next) => {
  // Função para sanitizar string
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .trim()
      .replace(/[<>]/g, '') // Remove < e >
      .replace(/javascript:/gi, '') // Remove javascript:
      .replace(/on\w+=/gi, ''); // Remove atributos de evento
  };

  // Função recursiva para sanitizar objeto
  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitizar body, query e params
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);

  next();
};

// Middleware para validar arquivos de upload
export const validateFileUpload = (options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    required = false
  } = options;

  return (req, res, next) => {
    if (!req.files && required) {
      return res.status(400).json({
        success: false,
        error: 'Arquivo é obrigatório'
      });
    }

    if (!req.files) {
      return next();
    }

    const files = Array.isArray(req.files) ? req.files : [req.files];

    for (const file of files) {
      // Verificar tamanho
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: `Arquivo muito grande. Máximo permitido: ${maxSize / 1024 / 1024}MB`
        });
      }

      // Verificar tipo
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
        });
      }
    }

    next();
  };
};

export default {
  schemas,
  validate,
  validateUserRegister,
  validateUserLogin,
  validateUserUpdate,
  validatePasswordChange,
  validateMarketCreate,
  validateMarketUpdate,
  validateListUsers,
  validateListMarkets,
  validateUuidParam,
  validateAddUserToMarket,
  sanitizeInput,
  validateFileUpload
};