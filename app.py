from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_cors import CORS
import json
import os
import sqlite3
from datetime import datetime
from threading import Lock
import logging

app = Flask(__name__, 
           static_folder='static',
           template_folder='templates')
CORS(app)

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Lock para operações thread-safe
db_lock = Lock()
# Adicione esta função antes da classe DatabaseManager no app.py:

def get_enhanced_sample_products():
    """Produtos com informações detalhadas de embalagem e promoções"""
    return [
        {
            "name": "Arroz Tipo 1 - 5kg",
            "category": "Grãos e Cereais",
            "brand": "Tio João",
            "description": "Arroz tipo 1 de alta qualidade - Embalagem familiar",
            "markets": {
                "Assaí Atacadista": {"price": 18.99, "unit": "pct"},
                "Carrefour": {"price": 22.50, "unit": "pct"},
                "Pão de Açucar": {"price": 24.90, "unit": "pct"}
            }
        },
        {
            "name": "Arroz Tipo 1 - 2kg",
            "category": "Grãos e Cereais",
            "brand": "Tio João",
            "description": "Arroz tipo 1 de alta qualidade - Embalagem média",
            "markets": {
                "Assaí Atacadista": {"price": 8.99, "unit": "pct"},
                "Carrefour": {"price": 10.50, "unit": "pct"},
                "Pão de Açucar": {"price": 11.90, "unit": "pct"}
            }
        },
        {
            "name": "Arroz Tipo 1 - 1kg",
            "category": "Grãos e Cereais",
            "brand": "Tio João",
            "description": "Arroz tipo 1 de alta qualidade - Embalagem pequena",
            "markets": {
                "Assaí Atacadista": {"price": 4.99, "unit": "pct"},
                "Carrefour": {"price": 5.50, "unit": "pct"},
                "Pão de Açucar": {"price": 6.20, "unit": "pct"}
            }
        },
        {
            "name": "Feijão Carioca - 1kg",
            "category": "Grãos e Cereais",
            "brand": "Camil",
            "description": "Feijão carioca selecionado",
            "markets": {
                "Assaí Atacadista": {"price": 7.99, "unit": "kg"},
                "Carrefour": {"price": 8.50, "unit": "kg"},
                "Pão de Açucar": {"price": 9.20, "unit": "kg"}
            }
        },
        {
            "name": "Feijão Carioca - 500g",
            "category": "Grãos e Cereais",
            "brand": "Camil",
            "description": "Feijão carioca selecionado - Embalagem pequena",
            "markets": {
                "Assaí Atacadista": {"price": 4.49, "unit": "pct"},
                "Carrefour": {"price": 4.90, "unit": "pct"},
                "Pão de Açucar": {"price": 5.30, "unit": "pct"}
            }
        },
        {
            "name": "Óleo de Soja - 900ml",
            "category": "Óleos e Vinagres",
            "brand": "Soya",
            "description": "Óleo de soja refinado",
            "markets": {
                "Assaí Atacadista": {"price": 4.50, "unit": "un"},
                "Carrefour": {"price": 5.20, "unit": "un"},
                "Pão de Açucar": {"price": 5.80, "unit": "un"}
            }
        },
        {
            "name": "Óleo de Soja - 500ml",
            "category": "Óleos e Vinagres",
            "brand": "Soya",
            "description": "Óleo de soja refinado - Embalagem pequena",
            "markets": {
                "Assaí Atacadista": {"price": 3.20, "unit": "un"},
                "Carrefour": {"price": 3.80, "unit": "un"},
                "Pão de Açucar": {"price": 4.20, "unit": "un"}
            }
        },
        {
            "name": "Açúcar Cristal - 1kg",
            "category": "Açúcar e Adoçantes",
            "brand": "União",
            "description": "Açúcar cristal especial",
            "markets": {
                "Assaí Atacadista": {"price": 3.99, "unit": "kg"},
                "Carrefour": {"price": 4.50, "unit": "kg"},
                "Pão de Açucar": {"price": 4.80, "unit": "kg"}
            }
        },
        {
            "name": "Leite Integral - 1L",
            "category": "Laticínios",
            "brand": "Nestlé",
            "description": "Leite UHT integral",
            "markets": {
                "Assaí Atacadista": {"price": 4.20, "unit": "L"},
                "Carrefour": {"price": 4.80, "unit": "L"},
                "Pão de Açucar": {"price": 5.10, "unit": "L"}
            }
        },
        {
            "name": "Leite Integral - 6x1L",
            "category": "Laticínios",
            "brand": "Nestlé",
            "description": "Leite UHT integral - Pack familiar",
            "markets": {
                "Assaí Atacadista": {"price": 23.90, "unit": "cx"},
                "Carrefour": {"price": 26.50, "unit": "cx"},
                "Pão de Açucar": {"price": 28.90, "unit": "cx"}
            }
        },
        {
            "name": "Frango Inteiro Congelado",
            "category": "Carnes",
            "brand": "Sadia",
            "description": "Frango inteiro congelado",
            "markets": {
                "Assaí Atacadista": {"price": 12.90, "unit": "kg"},
                "Carrefour": {"price": 14.50, "unit": "kg"},
                "Pão de Açucar": {"price": 15.80, "unit": "kg"}
            }
        },
        {
            "name": "Banana Nanica",
            "category": "Frutas",
            "brand": "Nacional",
            "description": "Banana nanica fresca",
            "markets": {
                "Assaí Atacadista": {"price": 4.99, "unit": "kg"},
                "Carrefour": {"price": 5.50, "unit": "kg"},
                "Pão de Açucar": {"price": 6.20, "unit": "kg"}
            }
        }
    ]

# Substitua a função populate_sample_data na classe DatabaseManager:
def populate_sample_data(self):
    """Popula o banco com dados de exemplo se estiver vazio"""
    with sqlite3.connect(self.db_path) as conn:
        cursor = conn.cursor()
        
        # Verificar se já existem produtos
        cursor.execute("SELECT COUNT(*) FROM products")
        count = cursor.fetchone()[0]
        
        if count == 0:
            sample_products = get_enhanced_sample_products()
            
            for product_data in sample_products:
                now = datetime.now().isoformat()
                markets_json = json.dumps(product_data["markets"])
                
                cursor.execute("""
                    INSERT INTO products (name, category, brand, description, markets, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    product_data["name"],
                    product_data["category"], 
                    product_data["brand"],
                    product_data["description"],
                    markets_json,
                    now,
                    now
                ))
                
                # Registrar histórico de preços inicial
                product_id = cursor.lastrowid
                for market, data in product_data["markets"].items():
                    cursor.execute("""
                        INSERT INTO price_history (product_id, market, price, timestamp)
                        VALUES (?, ?, ?, ?)
                    """, (product_id, market, data["price"], now))
            
            conn.commit()
            logger.info("✅ Dados de exemplo com embalagens inseridos no banco")

class DatabaseManager:
    def __init__(self, db_path="data/precinho.db"):
        self.db_path = db_path
        self.init_database()
        self.populate_sample_data()
    
    def init_database(self):
        """Inicializa o banco de dados com as tabelas necessárias"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Tabela de produtos
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    category TEXT,
                    brand TEXT,
                    description TEXT,
                    markets TEXT,  -- JSON string
                    created_at TEXT,
                    updated_at TEXT,
                    is_active BOOLEAN DEFAULT 1
                )
            """)
            
            # Tabela de histórico de preços
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS price_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER,
                    market TEXT,
                    price REAL,
                    timestamp TEXT,
                    FOREIGN KEY (product_id) REFERENCES products (id)
                )
            """)
            
            # Tabela de listas de compras (para futuro)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS shopping_lists (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT,
                    list_data TEXT,  -- JSON string
                    created_at TEXT,
                    updated_at TEXT
                )
            """)
            
            conn.commit()
            logger.info("✅ Banco de dados inicializado com sucesso")

    def populate_sample_data(self):
        """Popula o banco com dados de exemplo se estiver vazio"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Verificar se já existem produtos
            cursor.execute("SELECT COUNT(*) FROM products")
            count = cursor.fetchone()[0]
            
            if count == 0:
                sample_products = [
                    {
                        "name": "Arroz Tipo 1 - 5kg",
                        "category": "Grãos e Cereais",
                        "brand": "Tio João",
                        "description": "Arroz tipo 1 de alta qualidade",
                        "markets": {
                            "Assaí Atacadista": {"price": 18.99, "unit": "pct"},
                            "Carrefour": {"price": 22.50, "unit": "pct"},
                            "Pão de Açucar": {"price": 24.90, "unit": "pct"}
                        }
                    },
                    {
                        "name": "Feijão Carioca - 1kg",
                        "category": "Grãos e Cereais",
                        "brand": "Camil",
                        "description": "Feijão carioca selecionado",
                        "markets": {
                            "Assaí Atacadista": {"price": 7.99, "unit": "kg"},
                            "Carrefour": {"price": 8.50, "unit": "kg"},
                            "Pão de Açucar": {"price": 9.20, "unit": "kg"}
                        }
                    },
                    {
                        "name": "Óleo de Soja - 900ml",
                        "category": "Óleos e Vinagres",
                        "brand": "Soya",
                        "description": "Óleo de soja refinado",
                        "markets": {
                            "Assaí Atacadista": {"price": 4.50, "unit": "un"},
                            "Carrefour": {"price": 5.20, "unit": "un"},
                            "Pão de Açucar": {"price": 5.80, "unit": "un"}
                        }
                    },
                    {
                        "name": "Açúcar Cristal - 1kg",
                        "category": "Açúcar e Adoçantes",
                        "brand": "União",
                        "description": "Açúcar cristal especial",
                        "markets": {
                            "Assaí Atacadista": {"price": 3.99, "unit": "kg"},
                            "Carrefour": {"price": 4.50, "unit": "kg"},
                            "Pão de Açucar": {"price": 4.80, "unit": "kg"}
                        }
                    },
                    {
                        "name": "Leite Integral - 1L",
                        "category": "Laticínios",
                        "brand": "Nestlé",
                        "description": "Leite UHT integral",
                        "markets": {
                            "Assaí Atacadista": {"price": 4.20, "unit": "L"},
                            "Carrefour": {"price": 4.80, "unit": "L"},
                            "Pão de Açucar": {"price": 5.10, "unit": "L"}
                        }
                    },
                    {
                        "name": "Frango Inteiro Congelado",
                        "category": "Carnes",
                        "brand": "Sadia",
                        "description": "Frango inteiro congelado",
                        "markets": {
                            "Assaí Atacadista": {"price": 12.90, "unit": "kg"},
                            "Carrefour": {"price": 14.50, "unit": "kg"},
                            "Pão de Açucar": {"price": 15.80, "unit": "kg"}
                        }
                    },
                    {
                        "name": "Banana Nanica",
                        "category": "Frutas",
                        "brand": "Nacional",
                        "description": "Banana nanica fresca",
                        "markets": {
                            "Assaí Atacadista": {"price": 4.99, "unit": "kg"},
                            "Carrefour": {"price": 5.50, "unit": "kg"},
                            "Pão de Açucar": {"price": 6.20, "unit": "kg"}
                        }
                    },
                    {
                        "name": "Tomate Salada",
                        "category": "Vegetais",
                        "brand": "Nacional",
                        "description": "Tomate salada fresco",
                        "markets": {
                            "Assaí Atacadista": {"price": 8.99, "unit": "kg"},
                            "Carrefour": {"price": 9.50, "unit": "kg"},
                            "Pão de Açucar": {"price": 10.80, "unit": "kg"}
                        }
                    }
                ]
                
                for product_data in sample_products:
                    now = datetime.now().isoformat()
                    markets_json = json.dumps(product_data["markets"])
                    
                    cursor.execute("""
                        INSERT INTO products (name, category, brand, description, markets, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        product_data["name"],
                        product_data["category"], 
                        product_data["brand"],
                        product_data["description"],
                        markets_json,
                        now,
                        now
                    ))
                    
                    # Registrar histórico de preços inicial
                    product_id = cursor.lastrowid
                    for market, data in product_data["markets"].items():
                        cursor.execute("""
                            INSERT INTO price_history (product_id, market, price, timestamp)
                            VALUES (?, ?, ?, ?)
                        """, (product_id, market, data["price"], now))
                
                conn.commit()
                logger.info("✅ Dados de exemplo inseridos no banco")

    def get_connection(self):
        return sqlite3.connect(self.db_path)

# Instância global do gerenciador de banco
db_manager = DatabaseManager()

class ProductService:
    @staticmethod
    def get_all_products(search="", category=""):
        with db_lock:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                query = "SELECT * FROM products WHERE is_active = 1"
                params = []
                
                if search:
                    query += " AND (name LIKE ? OR brand LIKE ? OR description LIKE ?)"
                    search_param = f"%{search}%"
                    params.extend([search_param, search_param, search_param])
                
                if category:
                    query += " AND category = ?"
                    params.append(category)
                
                query += " ORDER BY name ASC"
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                products = []
                for row in rows:
                    product = {
                        'id': row[0],
                        'name': row[1],
                        'category': row[2],
                        'brand': row[3],
                        'description': row[4],
                        'markets': json.loads(row[5]) if row[5] else {},
                        'created_at': row[6],
                        'updated_at': row[7],
                        'is_active': bool(row[8])
                    }
                    products.append(product)
                
                return products

    @staticmethod
    def get_product_by_id(product_id):
        with db_lock:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM products WHERE id = ? AND is_active = 1", (product_id,))
                row = cursor.fetchone()
                
                if row:
                    return {
                        'id': row[0],
                        'name': row[1],
                        'category': row[2],
                        'brand': row[3],
                        'description': row[4],
                        'markets': json.loads(row[5]) if row[5] else {},
                        'created_at': row[6],
                        'updated_at': row[7],
                        'is_active': bool(row[8])
                    }
                return None

    @staticmethod
    def create_product(product_data):
        with db_lock:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                
                now = datetime.now().isoformat()
                markets_json = json.dumps(product_data.get('markets', {}))
                
                cursor.execute("""
                    INSERT INTO products (name, category, brand, description, markets, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    product_data.get('name', ''),
                    product_data.get('category', ''),
                    product_data.get('brand', ''),
                    product_data.get('description', ''),
                    markets_json,
                    now,
                    now
                ))
                
                product_id = cursor.lastrowid
                conn.commit()
                
                return ProductService.get_product_by_id(product_id)

    @staticmethod
    def get_categories():
        with db_lock:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT DISTINCT category 
                    FROM products 
                    WHERE category IS NOT NULL AND category != '' AND is_active = 1
                    ORDER BY category
                """)
                
                return [row[0] for row in cursor.fetchall()]

    @staticmethod
    def get_price_history(product_id, days=30):
        with db_lock:
            with db_manager.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT market, price, timestamp 
                    FROM price_history 
                    WHERE product_id = ? 
                    ORDER BY timestamp DESC 
                    LIMIT ?
                """, (product_id, days * 3))  # 3 mercados * dias
                
                history = []
                for row in cursor.fetchall():
                    history.append({
                        'market': row[0],
                        'price': row[1],
                        'timestamp': row[2]
                    })
                
                return history

# === ROUTES ===

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)

@app.route('/api/health')
def health():
    try:
        # Testar conexão com banco
        products_count = len(ProductService.get_all_products())
        
        return jsonify({
            'status': 'healthy',
            'message': 'Backend + Banco de dados funcionando!',
            'timestamp': datetime.now().isoformat(),
            'version': '2.0-etapa4',
            'database': {
                'connected': True,
                'products_count': products_count
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Erro no banco de dados: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        search = request.args.get('search', '').strip()
        category = request.args.get('category', '').strip()
        
        products = ProductService.get_all_products(search=search, category=category)
        
        return jsonify({
            'success': True,
            'data': products,
            'count': len(products),
            'filters': {
                'search': search if search else None,
                'category': category if category else None
            }
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar produtos: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor',
            'message': str(e)
        }), 500

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = ProductService.get_product_by_id(product_id)
        
        if not product:
            return jsonify({
                'success': False,
                'error': 'Produto não encontrado'
            }), 404
        
        # Incluir histórico de preços
        price_history = ProductService.get_price_history(product_id)
        product['price_history'] = price_history
        
        return jsonify({
            'success': True,
            'data': product
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar produto {product_id}: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@app.route('/api/products', methods=['POST'])
def create_product():
    try:
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Content-Type deve ser application/json'
            }), 400
        
        product_data = request.get_json()
        
        if not product_data.get('name'):
            return jsonify({
                'success': False,
                'error': 'Nome do produto é obrigatório'
            }), 400
        
        product = ProductService.create_product(product_data)
        
        logger.info(f"Produto criado: {product['name']} (ID: {product['id']})")
        
        return jsonify({
            'success': True,
            'data': product,
            'message': 'Produto criado com sucesso'
        }), 201
        
    except Exception as e:
        logger.error(f"Erro ao criar produto: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    try:
        categories = ProductService.get_categories()
        
        return jsonify({
            'success': True,
            'data': categories,
            'count': len(categories)
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar categorias: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_statistics():
    try:
        with db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            # Contagem de produtos
            cursor.execute("SELECT COUNT(*) FROM products WHERE is_active = 1")
            product_count = cursor.fetchone()[0]
            
            # Contagem por categoria
            cursor.execute("""
                SELECT category, COUNT(*) as count 
                FROM products 
                WHERE is_active = 1 AND category IS NOT NULL 
                GROUP BY category 
                ORDER BY count DESC
            """)
            categories = [{'name': row[0], 'count': row[1]} for row in cursor.fetchall()]
            
            # Último produto adicionado
            cursor.execute("""
                SELECT name, created_at 
                FROM products 
                WHERE is_active = 1 
                ORDER BY created_at DESC 
                LIMIT 1
            """)
            last_product = cursor.fetchone()
        
        return jsonify({
            'success': True,
            'data': {
                'total_products': product_count,
                'categories': categories,
                'last_product': {
                    'name': last_product[0] if last_product else None,
                    'created_at': last_product[1] if last_product else None
                },
                'database_status': 'connected',
                'last_updated': datetime.now().isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"🚀 Iniciando Precinho com banco de dados na porta {port}")
    
    app.run(host='0.0.0.0', port=port, debug=True)