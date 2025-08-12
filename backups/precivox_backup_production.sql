--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Ubuntu 17.5-1.pgdg20.04+1)
-- Dumped by pg_dump version 17.5 (Ubuntu 17.5-1.pgdg20.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: billing_cycle; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.billing_cycle AS ENUM (
    'monthly',
    'yearly'
);


ALTER TYPE public.billing_cycle OWNER TO postgres;

--
-- Name: market_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.market_status AS ENUM (
    'active',
    'pending',
    'suspended',
    'inactive'
);


ALTER TYPE public.market_status OWNER TO postgres;

--
-- Name: subscription_plan; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.subscription_plan AS ENUM (
    'basic',
    'premium',
    'enterprise'
);


ALTER TYPE public.subscription_plan OWNER TO postgres;

--
-- Name: subscription_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'cancelled',
    'expired',
    'pending'
);


ALTER TYPE public.subscription_status OWNER TO postgres;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'cliente',
    'gestor',
    'admin'
);


ALTER TYPE public.user_role OWNER TO postgres;

--
-- Name: user_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending_verification'
);


ALTER TYPE public.user_status OWNER TO postgres;

--
-- Name: get_market_product_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_market_product_stats(market_uuid uuid) RETURNS TABLE(total_products integer, total_categories integer, avg_price numeric, products_in_promotion integer, out_of_stock integer, last_update timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_products,
        COUNT(DISTINCT categoria)::INTEGER as total_categories,
        AVG(preco) as avg_price,
        COUNT(*) FILTER (WHERE promocao = true)::INTEGER as products_in_promotion,
        COUNT(*) FILTER (WHERE estoque = 0)::INTEGER as out_of_stock,
        MAX(updated_at) as last_update
    FROM products
    WHERE market_id = market_uuid AND status = 'active';
END;
$$;


ALTER FUNCTION public.get_market_product_stats(market_uuid uuid) OWNER TO postgres;

--
-- Name: get_user_markets(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_markets(user_uuid uuid) RETURNS TABLE(market_id uuid, market_name character varying, market_slug character varying, user_role character varying, market_status public.market_status)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.name,
        m.slug,
        mu.role,
        m.status
    FROM markets m
    JOIN market_users mu ON m.id = mu.market_id
    WHERE mu.user_id = user_uuid AND mu.status = 'active'
    ORDER BY m.name;
END;
$$;


ALTER FUNCTION public.get_user_markets(user_uuid uuid) OWNER TO postgres;

--
-- Name: search_products(text, uuid, character varying, numeric, numeric, boolean, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.search_products(search_term text DEFAULT NULL::text, market_uuid uuid DEFAULT NULL::uuid, categoria_filter character varying DEFAULT NULL::character varying, preco_min numeric DEFAULT NULL::numeric, preco_max numeric DEFAULT NULL::numeric, promocao_only boolean DEFAULT false, limit_count integer DEFAULT 50, offset_count integer DEFAULT 0) RETURNS TABLE(id uuid, nome character varying, categoria character varying, subcategoria character varying, preco numeric, loja character varying, promocao boolean, desconto numeric, avaliacao numeric, rank real)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nome,
        p.categoria,
        p.subcategoria,
        p.preco,
        p.loja,
        p.promocao,
        p.desconto,
        p.avaliacao,
        CASE 
            WHEN search_term IS NOT NULL THEN
                ts_rank_cd(p.search_vector, plainto_tsquery('portuguese', search_term))
            ELSE 0.0
        END as rank
    FROM products p
    WHERE p.status = 'active'
    AND (market_uuid IS NULL OR p.market_id = market_uuid)
    AND (search_term IS NULL OR p.search_vector @@ plainto_tsquery('portuguese', search_term))
    AND (categoria_filter IS NULL OR p.categoria = categoria_filter)
    AND (preco_min IS NULL OR p.preco >= preco_min)
    AND (preco_max IS NULL OR p.preco <= preco_max)
    AND (promocao_only = FALSE OR p.promocao = TRUE)
    ORDER BY 
        CASE WHEN search_term IS NOT NULL THEN rank ELSE 0 END DESC,
        p.promocao DESC,
        p.preco ASC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;


ALTER FUNCTION public.search_products(search_term text, market_uuid uuid, categoria_filter character varying, preco_min numeric, preco_max numeric, promocao_only boolean, limit_count integer, offset_count integer) OWNER TO postgres;

--
-- Name: update_category_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_category_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    categoria_record product_categories%ROWTYPE;
BEGIN
    -- Handle INSERT or UPDATE
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Insert or update category stats for new/updated product
        INSERT INTO product_categories (market_id, categoria, subcategoria, product_count, avg_price, min_price, max_price)
        SELECT 
            NEW.market_id,
            NEW.categoria,
            NEW.subcategoria,
            COUNT(*),
            AVG(preco),
            MIN(preco),
            MAX(preco)
        FROM products 
        WHERE market_id = NEW.market_id 
        AND categoria = NEW.categoria 
        AND COALESCE(subcategoria, '') = COALESCE(NEW.subcategoria, '')
        AND status = 'active'
        GROUP BY market_id, categoria, subcategoria
        ON CONFLICT (market_id, categoria, subcategoria)
        DO UPDATE SET
            product_count = EXCLUDED.product_count,
            avg_price = EXCLUDED.avg_price,
            min_price = EXCLUDED.min_price,
            max_price = EXCLUDED.max_price,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Handle UPDATE (old category if changed)
    IF TG_OP = 'UPDATE' AND (OLD.categoria != NEW.categoria OR COALESCE(OLD.subcategoria, '') != COALESCE(NEW.subcategoria, '')) THEN
        -- Update stats for old category
        INSERT INTO product_categories (market_id, categoria, subcategoria, product_count, avg_price, min_price, max_price)
        SELECT 
            OLD.market_id,
            OLD.categoria,
            OLD.subcategoria,
            COUNT(*),
            COALESCE(AVG(preco), 0),
            COALESCE(MIN(preco), 0),
            COALESCE(MAX(preco), 0)
        FROM products 
        WHERE market_id = OLD.market_id 
        AND categoria = OLD.categoria 
        AND COALESCE(subcategoria, '') = COALESCE(OLD.subcategoria, '')
        AND status = 'active'
        GROUP BY market_id, categoria, subcategoria
        ON CONFLICT (market_id, categoria, subcategoria)
        DO UPDATE SET
            product_count = EXCLUDED.product_count,
            avg_price = EXCLUDED.avg_price,
            min_price = EXCLUDED.min_price,
            max_price = EXCLUDED.max_price,
            updated_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        -- Update stats for deleted product's category
        INSERT INTO product_categories (market_id, categoria, subcategoria, product_count, avg_price, min_price, max_price)
        SELECT 
            OLD.market_id,
            OLD.categoria,
            OLD.subcategoria,
            COUNT(*),
            COALESCE(AVG(preco), 0),
            COALESCE(MIN(preco), 0),
            COALESCE(MAX(preco), 0)
        FROM products 
        WHERE market_id = OLD.market_id 
        AND categoria = OLD.categoria 
        AND COALESCE(subcategoria, '') = COALESCE(OLD.subcategoria, '')
        AND status = 'active'
        GROUP BY market_id, categoria, subcategoria
        ON CONFLICT (market_id, categoria, subcategoria)
        DO UPDATE SET
            product_count = EXCLUDED.product_count,
            avg_price = EXCLUDED.avg_price,
            min_price = EXCLUDED.min_price,
            max_price = EXCLUDED.max_price,
            updated_at = CURRENT_TIMESTAMP;
        
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_category_stats() OWNER TO postgres;

--
-- Name: update_market_search_vector(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_market_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('portuguese', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.address_city, '')), 'C') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.address_neighborhood, '')), 'D');
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_market_search_vector() OWNER TO postgres;

--
-- Name: update_product_search_vector(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_product_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('portuguese', COALESCE(NEW.nome, '')), 'A') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.categoria, '')), 'B') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.subcategoria, '')), 'B') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.marca, '')), 'C') ||
        setweight(to_tsvector('portuguese', COALESCE(NEW.loja, '')), 'D');
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_product_search_vector() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: user_has_market_permission(uuid, uuid, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.user_has_market_permission(user_uuid uuid, market_uuid uuid, required_permission character varying DEFAULT 'view'::character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    user_market_role VARCHAR;
    user_permissions JSONB;
    has_permission BOOLEAN := false;
BEGIN
    -- Get user's role and permissions for the market
    SELECT mu.role, mu.permissions
    INTO user_market_role, user_permissions
    FROM market_users mu
    WHERE mu.user_id = user_uuid 
    AND mu.market_id = market_uuid 
    AND mu.status = 'active';
    
    -- If no relationship found, check if user is admin
    IF user_market_role IS NULL THEN
        SELECT CASE WHEN role = 'admin' THEN true ELSE false END
        INTO has_permission
        FROM users
        WHERE id = user_uuid AND status = 'active';
        
        RETURN COALESCE(has_permission, false);
    END IF;
    
    -- Owner and manager have all permissions
    IF user_market_role IN ('owner', 'manager') THEN
        RETURN true;
    END IF;
    
    -- Check specific permissions in JSONB
    IF user_permissions IS NOT NULL THEN
        has_permission := user_permissions ? required_permission;
    END IF;
    
    RETURN COALESCE(has_permission, false);
END;
$$;


ALTER FUNCTION public.user_has_market_permission(user_uuid uuid, market_uuid uuid, required_permission character varying) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    session_id uuid,
    action character varying(100) NOT NULL,
    resource_type character varying(100) NOT NULL,
    resource_id uuid,
    description text,
    metadata jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: json_uploads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.json_uploads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    market_id uuid NOT NULL,
    filename character varying(255) NOT NULL,
    original_filename character varying(255) NOT NULL,
    file_size integer NOT NULL,
    file_hash character varying(64) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    total_products integer DEFAULT 0,
    products_created integer DEFAULT 0,
    products_updated integer DEFAULT 0,
    products_failed integer DEFAULT 0,
    error_message text,
    error_details jsonb,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    processing_duration integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid
);


ALTER TABLE public.json_uploads OWNER TO postgres;

--
-- Name: market_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.market_users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    market_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(50) DEFAULT 'manager'::character varying NOT NULL,
    permissions jsonb,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid
);


ALTER TABLE public.market_users OWNER TO postgres;

--
-- Name: markets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.markets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    cnpj character varying(18),
    business_name character varying(255),
    business_type character varying(100),
    website_url text,
    email character varying(255),
    phone character varying(20),
    whatsapp character varying(20),
    address_street text NOT NULL,
    address_number character varying(20),
    address_complement text,
    address_neighborhood character varying(100),
    address_city character varying(100) NOT NULL,
    address_state character varying(50) NOT NULL,
    address_zip_code character varying(20) NOT NULL,
    address_country character varying(50) DEFAULT 'Brasil'::character varying,
    latitude numeric(10,8),
    longitude numeric(11,8),
    operating_hours jsonb,
    category character varying(100),
    size_category character varying(50),
    delivery_available boolean DEFAULT false,
    pickup_available boolean DEFAULT true,
    payment_methods jsonb,
    status public.market_status DEFAULT 'pending'::public.market_status NOT NULL,
    verified boolean DEFAULT false,
    verification_date timestamp without time zone,
    logo_url text,
    cover_image_url text,
    gallery_images jsonb,
    total_products integer DEFAULT 0,
    total_categories integer DEFAULT 0,
    average_rating numeric(3,2) DEFAULT 0.00,
    total_reviews integer DEFAULT 0,
    total_users integer DEFAULT 0,
    has_database boolean DEFAULT false,
    last_data_sync timestamp without time zone,
    data_sync_frequency integer DEFAULT 24,
    database_size_mb numeric(10,2) DEFAULT 0.00,
    total_records integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    updated_by uuid,
    search_vector tsvector
);


ALTER TABLE public.markets OWNER TO postgres;

--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    market_id uuid NOT NULL,
    categoria character varying(100) NOT NULL,
    subcategoria character varying(100),
    product_count integer DEFAULT 0,
    avg_price numeric(10,2) DEFAULT 0.00,
    min_price numeric(10,2) DEFAULT 0.00,
    max_price numeric(10,2) DEFAULT 0.00,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_categories OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    market_id uuid NOT NULL,
    external_id character varying(255),
    nome character varying(255) NOT NULL,
    categoria character varying(100),
    subcategoria character varying(100),
    preco numeric(10,2) NOT NULL,
    loja character varying(255),
    endereco text,
    telefone character varying(20),
    marca character varying(100),
    codigo_barras character varying(50),
    peso character varying(20),
    origem character varying(50),
    estoque integer DEFAULT 0,
    disponivel boolean DEFAULT true,
    promocao boolean DEFAULT false,
    desconto numeric(5,2) DEFAULT 0.00,
    preco_original numeric(10,2),
    avaliacao numeric(3,2) DEFAULT 0.00,
    visualizacoes integer DEFAULT 0,
    conversoes integer DEFAULT 0,
    imagem_url text,
    imagens_adicionais jsonb,
    search_vector tsvector,
    data_source character varying(50) DEFAULT 'json_upload'::character varying,
    json_source_file character varying(255),
    last_updated_from_source timestamp without time zone,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    updated_by uuid,
    CONSTRAINT positive_price CHECK ((preco > (0)::numeric)),
    CONSTRAINT valid_discount CHECK (((desconto >= (0)::numeric) AND (desconto <= (100)::numeric)))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: subscription_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    subscription_id uuid NOT NULL,
    event_type character varying(50) NOT NULL,
    description text,
    amount numeric(10,2),
    currency character varying(3) DEFAULT 'BRL'::character varying,
    payment_method character varying(100),
    payment_status character varying(50),
    payment_gateway_transaction_id character varying(255),
    plan_snapshot jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid
);


ALTER TABLE public.subscription_history OWNER TO postgres;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    market_id uuid NOT NULL,
    plan public.subscription_plan DEFAULT 'basic'::public.subscription_plan NOT NULL,
    status public.subscription_status DEFAULT 'pending'::public.subscription_status NOT NULL,
    billing_cycle public.billing_cycle DEFAULT 'monthly'::public.billing_cycle NOT NULL,
    monthly_price numeric(10,2) NOT NULL,
    yearly_price numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'BRL'::character varying,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    next_billing_date timestamp without time zone NOT NULL,
    last_payment_date timestamp without time zone,
    payment_method character varying(100),
    payment_gateway character varying(50),
    payment_gateway_customer_id character varying(255),
    payment_gateway_subscription_id character varying(255),
    auto_renew boolean DEFAULT true,
    grace_period_days integer DEFAULT 7,
    features jsonb,
    max_products integer,
    max_users integer,
    max_api_calls integer,
    max_storage_mb integer,
    is_trial boolean DEFAULT false,
    trial_end_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    updated_by uuid
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    session_token character varying(255) NOT NULL,
    refresh_token character varying(255),
    expires_at timestamp without time zone NOT NULL,
    ip_address inet,
    user_agent text,
    device_type character varying(50),
    device_os character varying(100),
    device_browser character varying(100),
    location_country character varying(50),
    location_city character varying(100),
    is_active boolean DEFAULT true,
    last_activity timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(20),
    role public.user_role DEFAULT 'cliente'::public.user_role NOT NULL,
    status public.user_status DEFAULT 'pending_verification'::public.user_status NOT NULL,
    avatar_url text,
    date_of_birth date,
    gender character varying(20),
    address_street text,
    address_city character varying(100),
    address_state character varying(50),
    address_zip_code character varying(20),
    address_country character varying(50) DEFAULT 'Brasil'::character varying,
    preferred_language character varying(10) DEFAULT 'pt-BR'::character varying,
    timezone character varying(50) DEFAULT 'America/Sao_Paulo'::character varying,
    email_notifications boolean DEFAULT true,
    push_notifications boolean DEFAULT true,
    email_verified boolean DEFAULT false,
    email_verification_token character varying(255),
    email_verification_expires timestamp without time zone,
    password_reset_token character varying(255),
    password_reset_expires timestamp without time zone,
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret character varying(255),
    last_login timestamp without time zone,
    last_login_ip inet,
    login_count integer DEFAULT 0,
    failed_login_attempts integer DEFAULT 0,
    account_locked_until timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    updated_by uuid
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: v_active_markets; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_active_markets AS
 SELECT m.id,
    m.name,
    m.slug,
    m.description,
    m.cnpj,
    m.business_name,
    m.business_type,
    m.website_url,
    m.email,
    m.phone,
    m.whatsapp,
    m.address_street,
    m.address_number,
    m.address_complement,
    m.address_neighborhood,
    m.address_city,
    m.address_state,
    m.address_zip_code,
    m.address_country,
    m.latitude,
    m.longitude,
    m.operating_hours,
    m.category,
    m.size_category,
    m.delivery_available,
    m.pickup_available,
    m.payment_methods,
    m.status,
    m.verified,
    m.verification_date,
    m.logo_url,
    m.cover_image_url,
    m.gallery_images,
    m.total_products,
    m.total_categories,
    m.average_rating,
    m.total_reviews,
    m.total_users,
    m.has_database,
    m.last_data_sync,
    m.data_sync_frequency,
    m.database_size_mb,
    m.total_records,
    m.created_at,
    m.updated_at,
    m.created_by,
    m.updated_by,
    m.search_vector,
    s.plan AS subscription_plan,
    s.status AS subscription_status,
    s.end_date AS subscription_end_date,
    s.next_billing_date,
        CASE
            WHEN (s.end_date < CURRENT_TIMESTAMP) THEN 'expired'::text
            WHEN (s.end_date < (CURRENT_TIMESTAMP + '30 days'::interval)) THEN 'expiring_soon'::text
            ELSE 'active'::text
        END AS subscription_health
   FROM (public.markets m
     LEFT JOIN public.subscriptions s ON (((m.id = s.market_id) AND (s.status = 'active'::public.subscription_status))))
  WHERE (m.status = 'active'::public.market_status);


ALTER VIEW public.v_active_markets OWNER TO postgres;

--
-- Name: v_product_categories_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_product_categories_stats AS
 SELECT pc.id,
    pc.market_id,
    pc.categoria,
    pc.subcategoria,
    pc.product_count,
    pc.avg_price,
    pc.min_price,
    pc.max_price,
    pc.is_active,
    pc.created_at,
    pc.updated_at,
    m.name AS market_name,
    m.slug AS market_slug
   FROM (public.product_categories pc
     JOIN public.markets m ON ((pc.market_id = m.id)))
  WHERE ((pc.is_active = true) AND (m.status = 'active'::public.market_status))
  ORDER BY pc.product_count DESC;


ALTER VIEW public.v_product_categories_stats OWNER TO postgres;

--
-- Name: v_products_with_market; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_products_with_market AS
 SELECT p.id,
    p.market_id,
    p.external_id,
    p.nome,
    p.categoria,
    p.subcategoria,
    p.preco,
    p.loja,
    p.endereco,
    p.telefone,
    p.marca,
    p.codigo_barras,
    p.peso,
    p.origem,
    p.estoque,
    p.disponivel,
    p.promocao,
    p.desconto,
    p.preco_original,
    p.avaliacao,
    p.visualizacoes,
    p.conversoes,
    p.imagem_url,
    p.imagens_adicionais,
    p.search_vector,
    p.data_source,
    p.json_source_file,
    p.last_updated_from_source,
    p.status,
    p.created_at,
    p.updated_at,
    p.created_by,
    p.updated_by,
    m.name AS market_name,
    m.slug AS market_slug,
    m.address_city,
    m.address_state,
    m.verified AS market_verified
   FROM (public.products p
     JOIN public.markets m ON ((p.market_id = m.id)))
  WHERE (((p.status)::text = 'active'::text) AND (m.status = 'active'::public.market_status));


ALTER VIEW public.v_products_with_market OWNER TO postgres;

--
-- Name: v_promoted_products; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_promoted_products AS
 SELECT p.id,
    p.market_id,
    p.external_id,
    p.nome,
    p.categoria,
    p.subcategoria,
    p.preco,
    p.loja,
    p.endereco,
    p.telefone,
    p.marca,
    p.codigo_barras,
    p.peso,
    p.origem,
    p.estoque,
    p.disponivel,
    p.promocao,
    p.desconto,
    p.preco_original,
    p.avaliacao,
    p.visualizacoes,
    p.conversoes,
    p.imagem_url,
    p.imagens_adicionais,
    p.search_vector,
    p.data_source,
    p.json_source_file,
    p.last_updated_from_source,
    p.status,
    p.created_at,
    p.updated_at,
    p.created_by,
    p.updated_by,
    m.name AS market_name,
    m.slug AS market_slug,
    (p.preco * ((1)::numeric - (p.desconto / (100)::numeric))) AS preco_promocional
   FROM (public.products p
     JOIN public.markets m ON ((p.market_id = m.id)))
  WHERE ((p.promocao = true) AND ((p.status)::text = 'active'::text) AND (m.status = 'active'::public.market_status))
  ORDER BY p.desconto DESC, p.preco;


ALTER VIEW public.v_promoted_products OWNER TO postgres;

--
-- Name: v_user_dashboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_user_dashboard AS
 SELECT u.id,
    u.name,
    u.email,
    u.role,
    u.status,
    u.last_login,
    count(DISTINCT mu.market_id) AS market_count,
    json_agg(
        CASE
            WHEN (mu.market_id IS NOT NULL) THEN json_build_object('market_id', m.id, 'market_name', m.name, 'market_slug', m.slug, 'user_role', mu.role, 'market_status', m.status)
            ELSE NULL::json
        END) FILTER (WHERE (mu.market_id IS NOT NULL)) AS markets
   FROM ((public.users u
     LEFT JOIN public.market_users mu ON (((u.id = mu.user_id) AND ((mu.status)::text = 'active'::text))))
     LEFT JOIN public.markets m ON ((mu.market_id = m.id)))
  GROUP BY u.id, u.name, u.email, u.role, u.status, u.last_login;


ALTER VIEW public.v_user_dashboard OWNER TO postgres;

--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, user_id, session_id, action, resource_type, resource_id, description, metadata, ip_address, user_agent, created_at) FROM stdin;
4f6aa53c-2684-476a-a9ef-cc4835101b3a	\N	\N	migration	database	\N	Initial database schema created	{"tables_created": ["users", "markets", "market_users", "subscriptions", "subscription_history", "user_sessions", "audit_logs"], "migration_version": "001"}	\N	\N	2025-08-01 01:26:34.48506
310094c4-b227-4a1b-8cfa-8a2421ca5c5a	\N	\N	import	products	\N	Importação em lote de JSONs existentes	{"files_processed": 13, "products_failed": 151, "products_created": 0, "products_updated": 0}	\N	\N	2025-08-01 16:24:39.708466
0ff0f414-bdc0-40db-945b-e4889298c2f6	\N	\N	migration	database	\N	Products table and JSON upload system created	{"tables_created": ["products", "json_uploads", "product_categories"], "migration_version": "002"}	\N	\N	2025-08-01 16:26:26.98603
9e8ad4a2-5199-4556-97a7-09b8fb633522	\N	\N	import	products	\N	Importação em lote de JSONs existentes	{"files_processed": 13, "products_failed": 0, "products_created": 151, "products_updated": 0}	\N	\N	2025-08-01 16:26:31.787668
\.


--
-- Data for Name: json_uploads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.json_uploads (id, market_id, filename, original_filename, file_size, file_hash, status, total_products, products_created, products_updated, products_failed, error_message, error_details, started_at, completed_at, processing_duration, created_at, created_by) FROM stdin;
\.


--
-- Data for Name: market_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.market_users (id, market_id, user_id, role, permissions, status, created_at, updated_at, created_by) FROM stdin;
1e6ffd93-72aa-43f5-ae2e-80bb0c784367	29520ebc-4471-4270-9257-384562aefdce	e87b4cf1-1010-4d04-9b64-9cc606df5b61	owner	\N	active	2025-08-01 01:26:34.47679	2025-08-01 01:26:34.47679	e87b4cf1-1010-4d04-9b64-9cc606df5b61
c025d098-6b4c-4563-96b5-993c8215c542	003bbaf7-5c5f-4618-80bc-027fc90fb7d5	e87b4cf1-1010-4d04-9b64-9cc606df5b61	owner	\N	active	2025-08-01 01:26:34.47679	2025-08-01 01:26:34.47679	e87b4cf1-1010-4d04-9b64-9cc606df5b61
494dd818-9b62-49d7-af4b-810950294490	9e4cdfce-a666-4933-b9f6-6226f78f1be1	e87b4cf1-1010-4d04-9b64-9cc606df5b61	owner	\N	active	2025-08-01 01:26:34.47679	2025-08-01 01:26:34.47679	e87b4cf1-1010-4d04-9b64-9cc606df5b61
\.


--
-- Data for Name: markets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.markets (id, name, slug, description, cnpj, business_name, business_type, website_url, email, phone, whatsapp, address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip_code, address_country, latitude, longitude, operating_hours, category, size_category, delivery_available, pickup_available, payment_methods, status, verified, verification_date, logo_url, cover_image_url, gallery_images, total_products, total_categories, average_rating, total_reviews, total_users, has_database, last_data_sync, data_sync_frequency, database_size_mb, total_records, created_at, updated_at, created_by, updated_by, search_vector) FROM stdin;
9e4cdfce-a666-4933-b9f6-6226f78f1be1	Hiper Atacadão Franco	hiper-atacadao-franco	Atacado e varejo com os melhores preços	11.222.333/0001-44	\N	\N	\N	contato@atacadaofranco.com.br	(11) 7777-8888	\N	Rodovia Presidente Dutra	Km 32	\N	Distrito Industrial	Franco da Rocha	SP	07800-100	Brasil	\N	\N	\N	Atacadista	large	f	t	\N	active	t	\N	\N	\N	\N	5	5	0.00	0	0	t	2025-08-01 16:26:31.403744	24	0.00	0	2025-08-01 01:26:34.471863	2025-08-01 16:26:31.403744	\N	\N	'atac':4B 'atacadã':2A 'distrit':14 'franc':3A,11C 'hip':1A 'industrial':15 'melhor':9B 'prec':10B 'roch':13C 'varej':6B
1c5802cc-cf00-4989-b21a-e4e6b35e6918	extra franco	extra-franco	Mercado importado do JSON: extra franco	\N	\N	\N	\N	\N	\N	\N	Endereço não informado	\N	\N	\N	Franco da Rocha	SP	07800-000	Brasil	\N	\N	\N	Supermercado	medium	f	t	\N	active	t	\N	\N	\N	\N	6	6	0.00	0	0	t	2025-08-01 16:26:31.424692	24	0.00	0	2025-08-01 16:24:39.135576	2025-08-01 16:26:31.424692	e87b4cf1-1010-4d04-9b64-9cc606df5b61	\N	'extra':1A,7B 'franc':2A,8B,9C 'import':4B 'json':6B 'merc':3B 'roch':11C
ff51ca83-c8da-42f4-adfc-a7dd491e1896	hiper franco	hiper-franco	Mercado importado do JSON: hiper franco	\N	\N	\N	\N	\N	\N	\N	Endereço não informado	\N	\N	\N	Franco da Rocha	SP	07800-000	Brasil	\N	\N	\N	Supermercado	medium	f	t	\N	active	t	\N	\N	\N	\N	7	5	0.00	0	0	t	2025-08-01 16:26:31.445486	24	0.00	0	2025-08-01 16:24:39.18196	2025-08-01 16:26:31.445486	e87b4cf1-1010-4d04-9b64-9cc606df5b61	\N	'franc':2A,8B,9C 'hip':1A,7B 'import':4B 'json':6B 'merc':3B 'roch':11C
bdb617e6-d49e-4223-b549-01fb68c923ed	mercadinho vila bela	mercadinho-vila-bela	Mercado importado do JSON: mercadinho vila bela	\N	\N	\N	\N	\N	\N	\N	Endereço não informado	\N	\N	\N	Franco da Rocha	SP	07800-000	Brasil	\N	\N	\N	Supermercado	medium	f	t	\N	active	t	\N	\N	\N	\N	30	6	0.00	0	0	t	2025-08-01 16:26:31.500641	24	0.00	0	2025-08-01 16:24:39.228094	2025-08-01 16:26:31.500641	e87b4cf1-1010-4d04-9b64-9cc606df5b61	\N	'bel':3A,10B 'franc':11C 'import':5B 'json':7B 'merc':4B 'mercadinh':1A,8B 'roch':13C 'vil':2A,9B
f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	mercado 120	mercado-120	Mercado importado do JSON: mercado 120	\N	\N	\N	\N	\N	\N	\N	Endereço não informado	\N	\N	\N	Franco da Rocha	SP	07800-000	Brasil	\N	\N	\N	Supermercado	medium	f	t	\N	active	t	\N	\N	\N	\N	13	8	0.00	0	0	t	2025-08-01 16:26:31.535975	24	0.00	0	2025-08-01 16:24:39.302715	2025-08-01 16:26:31.535975	e87b4cf1-1010-4d04-9b64-9cc606df5b61	\N	'120':2A,8B 'franc':9C 'import':4B 'json':6B 'merc':1A,3B,7B 'roch':11C
003bbaf7-5c5f-4618-80bc-027fc90fb7d5	Mercado Central	mercado-central	Mercado tradicional no centro da cidade	98.765.432/0001-10	\N	\N	\N	admin@mercadocentral.com.br	(11) 8765-4321	\N	Av. Principal	456	\N	Centro	São Paulo	SP	01000-000	Brasil	\N	\N	\N	Mercado	small	f	t	\N	pending	f	\N	\N	\N	\N	6	6	0.00	0	0	t	2025-08-01 16:26:31.55158	24	0.00	0	2025-08-01 01:26:34.471863	2025-08-01 16:26:31.55158	\N	\N	'centr':6B,11 'central':2A 'cidad':8B 'merc':1A,3B 'paul':10C 'tradicional':4B
e2ed6490-e930-44b6-89db-40d2ce1b8ab5	mercado da família	mercado-da-familia	Mercado importado do JSON: mercado da família	\N	\N	\N	\N	\N	\N	\N	Endereço não informado	\N	\N	\N	Franco da Rocha	SP	07800-000	Brasil	\N	\N	\N	Supermercado	medium	f	t	\N	active	t	\N	\N	\N	\N	5	5	0.00	0	0	t	2025-08-01 16:26:31.568853	24	0.00	0	2025-08-01 16:24:39.37712	2025-08-01 16:26:31.568853	e87b4cf1-1010-4d04-9b64-9cc606df5b61	\N	'famíl':3A,10B 'franc':11C 'import':5B 'json':7B 'merc':1A,4B,8B 'roch':13C
6762f94f-db65-4ef1-82aa-15a286cbecd5	mercado popular	mercado-popular	Mercado importado do JSON: mercado popular	\N	\N	\N	\N	\N	\N	\N	Endereço não informado	\N	\N	\N	Franco da Rocha	SP	07800-000	Brasil	\N	\N	\N	Supermercado	medium	f	t	\N	active	t	\N	\N	\N	\N	5	5	0.00	0	0	t	2025-08-01 16:26:31.594238	24	0.00	0	2025-08-01 16:24:39.415357	2025-08-01 16:26:31.594238	e87b4cf1-1010-4d04-9b64-9cc606df5b61	\N	'franc':9C 'import':4B 'json':6B 'merc':1A,3B,7B 'popul':2A,8B 'roch':11C
fec62d21-844b-4c71-9300-d1dd2e6041d4	mercado porto	mercado-porto	Mercado importado do JSON: mercado porto	\N	\N	\N	\N	\N	\N	\N	Endereço não informado	\N	\N	\N	Franco da Rocha	SP	07800-000	Brasil	\N	\N	\N	Supermercado	medium	f	t	\N	active	t	\N	\N	\N	\N	12	9	0.00	0	0	t	2025-08-01 16:26:31.624791	24	0.00	0	2025-08-01 16:24:39.45995	2025-08-01 16:26:31.624791	e87b4cf1-1010-4d04-9b64-9cc606df5b61	\N	'franc':9C 'import':4B 'json':6B 'merc':1A,3B,7B 'port':2A,8B 'roch':11C
48147fef-9418-4485-9658-a3538e3011d5	mercado sao joao	mercado-sao-joao	Mercado importado do JSON: mercado sao joao	\N	\N	\N	\N	\N	\N	\N	Endereço não informado	\N	\N	\N	Franco da Rocha	SP	07800-000	Brasil	\N	\N	\N	Supermercado	medium	f	t	\N	active	t	\N	\N	\N	\N	31	15	0.00	0	0	t	2025-08-01 16:26:31.68063	24	0.00	0	2025-08-01 16:24:39.526071	2025-08-01 16:26:31.68063	e87b4cf1-1010-4d04-9b64-9cc606df5b61	\N	'franc':11C 'import':5B 'joa':3A,10B 'json':7B 'merc':1A,4B,8B 'roch':13C 'sao':2A,9B
bb9c6b33-adda-4e41-8ecd-99e8090d03cc	padaria central	padaria-central	Mercado importado do JSON: padaria central	\N	\N	\N	\N	\N	\N	\N	Endereço não informado	\N	\N	\N	Franco da Rocha	SP	07800-000	Brasil	\N	\N	\N	Supermercado	medium	f	t	\N	active	t	\N	\N	\N	\N	1	1	0.00	0	0	t	2025-08-01 16:26:31.693554	24	0.00	0	2025-08-01 16:24:39.600736	2025-08-01 16:26:31.693554	e87b4cf1-1010-4d04-9b64-9cc606df5b61	\N	'central':2A,8B 'franc':9C 'import':4B 'json':6B 'merc':3B 'pad':1A,7B 'roch':11C
441437a5-5656-4489-8771-8340dc53cb6e	santa fe pq paulista	santa-fe-pq-paulista	Mercado importado do JSON: santa fe pq paulista	\N	\N	\N	\N	\N	\N	\N	Endereço não informado	\N	\N	\N	Franco da Rocha	SP	07800-000	Brasil	\N	\N	\N	Supermercado	medium	f	t	\N	active	t	\N	\N	\N	\N	25	11	0.00	0	0	t	2025-08-01 16:26:31.760288	24	0.00	0	2025-08-01 16:24:39.62825	2025-08-01 16:26:31.760288	e87b4cf1-1010-4d04-9b64-9cc606df5b61	\N	'fe':2A,10B 'franc':13C 'import':6B 'json':8B 'merc':5B 'paulist':4A,12B 'pq':3A,11B 'roch':15C 'sant':1A,9B
29520ebc-4471-4270-9257-384562aefdce	Supermercado Vila Nova	supermercado-vila-nova	Supermercado familiar com os melhores preços de Franco da Rocha	12.345.678/0001-90	\N	\N	\N	contato@vilanova.com.br	(11) 9876-5432	\N	Rua das Flores	123	\N	Vila Nova	Franco da Rocha	SP	07800-000	Brasil	\N	\N	\N	Supermercado	medium	f	t	\N	active	t	\N	\N	\N	\N	5	5	0.00	0	0	t	2025-08-01 16:26:31.785178	24	0.00	0	2025-08-01 01:26:34.471863	2025-08-01 16:26:31.785178	\N	\N	'famili':5B 'franc':11B,14C 'melhor':8B 'nov':3A,18 'prec':9B 'roch':13B,16C 'supermerc':1A,4B 'vil':2A,17
\.


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_categories (id, market_id, categoria, subcategoria, product_count, avg_price, min_price, max_price, is_active, created_at, updated_at) FROM stdin;
4b008ad6-d01a-4028-81b7-4d08470fd3a0	9e4cdfce-a666-4933-b9f6-6226f78f1be1	limpeza	sabao_po	1	18.90	18.90	18.90	t	2025-08-01 16:26:31.370241	2025-08-01 16:26:31.370241
5d2ef461-e541-461b-b7f2-d875273c06f8	9e4cdfce-a666-4933-b9f6-6226f78f1be1	massas	espaguete	1	4.25	4.25	4.25	t	2025-08-01 16:26:31.370241	2025-08-01 16:26:31.370241
d15435a8-d7e6-4bca-a815-48db08a552ad	9e4cdfce-a666-4933-b9f6-6226f78f1be1	congelados	pizzas	1	16.90	16.90	16.90	t	2025-08-01 16:26:31.370241	2025-08-01 16:26:31.370241
e74f15c4-7a85-426e-a911-00e78dda1046	9e4cdfce-a666-4933-b9f6-6226f78f1be1	carnes	bovina	1	79.90	79.90	79.90	t	2025-08-01 16:26:31.370241	2025-08-01 16:26:31.370241
c1ab03ca-a44a-4df8-bdcc-d5270dc592e2	9e4cdfce-a666-4933-b9f6-6226f78f1be1	biscoitos	salgado	1	3.50	3.50	3.50	t	2025-08-01 16:26:31.370241	2025-08-01 16:26:31.370241
a6b106f9-8b75-4746-bb71-7f8bb187551f	1c5802cc-cf00-4989-b21a-e4e6b35e6918	bebidas	refrigerantes	1	6.99	6.99	6.99	t	2025-08-01 16:26:31.410889	2025-08-01 16:26:31.410889
770536c2-cac6-4717-8919-905e07cb20c2	1c5802cc-cf00-4989-b21a-e4e6b35e6918	limpeza	detergentes	1	2.79	2.79	2.79	t	2025-08-01 16:26:31.410889	2025-08-01 16:26:31.410889
19142079-45c5-4d02-b91e-a9a02edf5162	1c5802cc-cf00-4989-b21a-e4e6b35e6918	massas	lasanha	1	8.90	8.90	8.90	t	2025-08-01 16:26:31.410889	2025-08-01 16:26:31.410889
fddcfd6c-0416-4231-b8e3-b7e97fbddabe	1c5802cc-cf00-4989-b21a-e4e6b35e6918	doces	chocolates	1	4.75	4.75	4.75	t	2025-08-01 16:26:31.410889	2025-08-01 16:26:31.410889
887c6e0a-9c62-4adb-b7f2-362fdf443625	1c5802cc-cf00-4989-b21a-e4e6b35e6918	carnes	bovina	1	59.90	59.90	59.90	t	2025-08-01 16:26:31.410889	2025-08-01 16:26:31.410889
1d121a2b-ee09-4863-acc8-d731ba9a35da	1c5802cc-cf00-4989-b21a-e4e6b35e6918	hortifruti	legumes	1	5.20	5.20	5.20	t	2025-08-01 16:26:31.410889	2025-08-01 16:26:31.410889
946b1a52-52f5-4b4d-88f5-c91fedceae97	ff51ca83-c8da-42f4-adfc-a7dd491e1896	bebidas	sucos	1	9.90	9.90	9.90	t	2025-08-01 16:26:31.428626	2025-08-01 16:26:31.428626
1279cdb0-5870-4912-82ef-bcb177d852f9	ff51ca83-c8da-42f4-adfc-a7dd491e1896	graos	arroz	1	26.75	26.75	26.75	t	2025-08-01 16:26:31.428626	2025-08-01 16:26:31.428626
73eba7af-d3c8-4705-8a45-13da0ade44c7	ff51ca83-c8da-42f4-adfc-a7dd491e1896	oleos	soja	1	8.90	8.90	8.90	t	2025-08-01 16:26:31.428626	2025-08-01 16:26:31.428626
0af0dfd7-e0c8-4d0a-a71c-098c6f76e319	ff51ca83-c8da-42f4-adfc-a7dd491e1896	enlatados	atum	1	8.30	8.30	8.30	t	2025-08-01 16:26:31.428626	2025-08-01 16:26:31.428626
9510a740-ef12-43b5-a0a9-febb07f3d3ab	ff51ca83-c8da-42f4-adfc-a7dd491e1896	bebidas	vinhos	1	39.90	39.90	39.90	t	2025-08-01 16:26:31.428626	2025-08-01 16:26:31.428626
a207867b-616f-4979-9df0-a7dd2288302e	ff51ca83-c8da-42f4-adfc-a7dd491e1896	bebidas	cervejas	1	7.90	7.90	7.90	t	2025-08-01 16:26:31.428626	2025-08-01 16:26:31.428626
651d32bc-4f2b-4baf-b500-14d3936f0b94	ff51ca83-c8da-42f4-adfc-a7dd491e1896	cafe	soluvel	1	18.90	18.90	18.90	t	2025-08-01 16:26:31.428626	2025-08-01 16:26:31.428626
d7e62877-bc0b-463f-bc0d-64055bc9d283	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	hortifruti	legumes	4	4.52	3.49	5.99	t	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146
f7e8a208-6220-464b-9c1a-8657551d5b1e	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	frios	salsichas	1	6.49	6.49	6.49	t	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146
178ee7f3-d2a9-4ae9-8807-2107848fa8b1	003bbaf7-5c5f-4618-80bc-027fc90fb7d5	laticinios	queijo	1	22.70	22.70	22.70	t	2025-08-01 16:26:31.539415	2025-08-01 16:26:31.539415
4a66bfca-4025-46d8-9d37-5d3de0719db4	bdb617e6-d49e-4223-b549-01fb68c923ed	bebidas	bebidas	5	17.92	2.80	32.60	t	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965
7711a979-4b01-431c-a3ae-2e21cc9f020a	003bbaf7-5c5f-4618-80bc-027fc90fb7d5	carnes	bovina	1	42.50	42.50	42.50	t	2025-08-01 16:26:31.539415	2025-08-01 16:26:31.539415
1e2b7365-84f0-49db-aaff-f831d1cf37dd	003bbaf7-5c5f-4618-80bc-027fc90fb7d5	paes	forma	1	12.50	12.50	12.50	t	2025-08-01 16:26:31.539415	2025-08-01 16:26:31.539415
eceb5425-41d3-441d-80d9-5201c83fc77f	003bbaf7-5c5f-4618-80bc-027fc90fb7d5	petiscos	salgadinhos	1	4.99	4.99	4.99	t	2025-08-01 16:26:31.539415	2025-08-01 16:26:31.539415
7fbdd574-06f6-4cb0-afd3-452bbf85d048	bdb617e6-d49e-4223-b549-01fb68c923ed	graos	graos	5	9.00	3.79	19.33	t	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965
74ed9eda-4d4f-490b-b103-fb4d3b5ccc6a	003bbaf7-5c5f-4618-80bc-027fc90fb7d5	bebidas	cervejas	1	5.99	5.99	5.99	t	2025-08-01 16:26:31.539415	2025-08-01 16:26:31.539415
e3b19011-7bfd-41af-b19f-3592c475b3f0	003bbaf7-5c5f-4618-80bc-027fc90fb7d5	oleos	azeite	1	29.90	29.90	29.90	t	2025-08-01 16:26:31.539415	2025-08-01 16:26:31.539415
c1e20425-c29e-478e-a2a6-ca1c9c679583	e2ed6490-e930-44b6-89db-40d2ce1b8ab5	bebidas	aguas	1	3.20	3.20	3.20	t	2025-08-01 16:26:31.557418	2025-08-01 16:26:31.557418
6e176a53-5b38-4719-9461-6a5d1070a6ba	bdb617e6-d49e-4223-b549-01fb68c923ed	laticinios	laticinios	5	13.05	4.29	22.96	t	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965
44270f90-5246-4ae1-a4b6-dc475a968a37	e2ed6490-e930-44b6-89db-40d2ce1b8ab5	graos	feijao	1	9.85	9.85	9.85	t	2025-08-01 16:26:31.557418	2025-08-01 16:26:31.557418
f5e5aca3-ade8-46d7-adc7-ba2f035462ae	e2ed6490-e930-44b6-89db-40d2ce1b8ab5	acucar	refinado	1	4.20	4.20	4.20	t	2025-08-01 16:26:31.557418	2025-08-01 16:26:31.557418
178a3b47-b395-4b01-b4d5-f6532e38a829	e2ed6490-e930-44b6-89db-40d2ce1b8ab5	temperos	sal	1	3.20	3.20	3.20	t	2025-08-01 16:26:31.557418	2025-08-01 16:26:31.557418
a8a67c69-52ff-44ba-a8b0-17689fd7d341	bdb617e6-d49e-4223-b549-01fb68c923ed	limpeza	limpeza	5	18.35	8.55	30.53	t	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965
b4f046bb-f4f7-4b82-a94c-0d07d1c364f9	e2ed6490-e930-44b6-89db-40d2ce1b8ab5	pereciveis	ovos	1	12.50	12.50	12.50	t	2025-08-01 16:26:31.557418	2025-08-01 16:26:31.557418
60a59bbd-1d21-4d82-b146-555e3b638f85	6762f94f-db65-4ef1-82aa-15a286cbecd5	higiene	shampoo	1	22.90	22.90	22.90	t	2025-08-01 16:26:31.574551	2025-08-01 16:26:31.574551
e33acc36-d6a6-4ec8-905b-28d9d06aadc4	6762f94f-db65-4ef1-82aa-15a286cbecd5	cafe	tradicional	1	14.90	14.90	14.90	t	2025-08-01 16:26:31.574551	2025-08-01 16:26:31.574551
de5d8f32-2735-4646-a6b5-9f80955781d2	bdb617e6-d49e-4223-b549-01fb68c923ed	higiene	higiene	5	22.58	11.73	33.04	t	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965
1b16ddac-ded0-41ae-b809-40ea96675f62	6762f94f-db65-4ef1-82aa-15a286cbecd5	frutas	tropicais	1	7.90	7.90	7.90	t	2025-08-01 16:26:31.574551	2025-08-01 16:26:31.574551
431ca9b7-0957-45ac-8313-86e09dedb8fd	6762f94f-db65-4ef1-82aa-15a286cbecd5	oleos	girassol	1	10.50	10.50	10.50	t	2025-08-01 16:26:31.574551	2025-08-01 16:26:31.574551
ca1ecc83-1e4b-479d-bed1-564e2171504f	6762f94f-db65-4ef1-82aa-15a286cbecd5	hortifruti	legumes	1	6.99	6.99	6.99	t	2025-08-01 16:26:31.574551	2025-08-01 16:26:31.574551
b3fc680f-a2fe-4394-b677-32218db841a6	bdb617e6-d49e-4223-b549-01fb68c923ed	hortifruti	hortifruti	5	20.19	4.72	30.92	t	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965
4a92cce8-ef54-4d10-8384-f045cf9e1139	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	graos	acucar	1	4.29	4.29	4.29	t	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146
312cbb61-1235-4e1f-9ae4-c9a1a4e9cfa4	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	condimentos	maionese	1	9.99	9.99	9.99	t	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146
4f881ecb-c49f-4bb4-83b6-54e62b15bde2	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	graos	feijao	1	8.49	8.49	8.49	t	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146
8196a03a-2900-4fce-a422-3cbfb57eec66	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	higiene	creme_dental	1	3.99	3.99	3.99	t	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146
8ec605c6-d379-470c-99e1-916b778c9eea	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	limpeza	descartaveis	1	7.49	7.49	7.49	t	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146
0ebf262a-92da-4631-9be6-d0e97e3efb7f	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	bebidas	cha	1	4.99	4.99	4.99	t	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146
bd4721b6-15a4-428b-a430-e8a5f55db50f	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	doces	doce_leite	1	8.29	8.29	8.29	t	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146
0c870a59-0cd6-4593-af8d-31e261ff40fa	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	limpeza	desinfetantes	1	5.29	5.29	5.29	t	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146
fd203974-9b3e-4c64-807b-11b2bdb9fc4e	fec62d21-844b-4c71-9300-d1dd2e6041d4	higiene	shampoo	1	10.90	10.90	10.90	t	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276
d1ac8e62-6b2c-4e37-baf8-3de84fafbae3	fec62d21-844b-4c71-9300-d1dd2e6041d4	higiene	desodorantes	1	12.75	12.75	12.75	t	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276
4dfc5132-d6da-4a61-a2be-e952e5df3090	fec62d21-844b-4c71-9300-d1dd2e6041d4	bebidas	achocolatados	1	8.49	8.49	8.49	t	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276
7261631a-2100-4c16-bbea-41cafcdf0838	fec62d21-844b-4c71-9300-d1dd2e6041d4	doces	gelatina	1	1.89	1.89	1.89	t	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276
58dac119-19a2-428d-a086-08f66b5bbaa3	fec62d21-844b-4c71-9300-d1dd2e6041d4	frios	queijo	1	10.90	10.90	10.90	t	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276
014f5479-9404-4d5f-b5c5-21e08448b3f1	fec62d21-844b-4c71-9300-d1dd2e6041d4	congelados	hamburguer	1	17.99	17.99	17.99	t	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276
0e14d33c-6e6c-4f45-b658-e71f86406215	fec62d21-844b-4c71-9300-d1dd2e6041d4	limpeza	esponjas	1	3.60	3.60	3.60	t	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276
5da9969a-e57a-4fad-82bf-7bee36b1dc54	fec62d21-844b-4c71-9300-d1dd2e6041d4	laticinios	creme_leite	1	4.49	4.49	4.49	t	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276
c3278912-1a53-4c2a-a7bc-6a2c200e0def	fec62d21-844b-4c71-9300-d1dd2e6041d4	condimentos	shoyu	1	3.75	3.75	3.75	t	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276
f7a9d1d8-ed7c-4e7d-a87d-9717890aa74d	fec62d21-844b-4c71-9300-d1dd2e6041d4	higiene	sabonetes	1	2.25	2.25	2.25	t	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276
338fec17-5d36-44d7-ab2c-3d9ccc5fc93d	fec62d21-844b-4c71-9300-d1dd2e6041d4	graos	farinhas	1	4.49	4.49	4.49	t	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276
3760265c-6667-48ed-84f3-911207ab5929	fec62d21-844b-4c71-9300-d1dd2e6041d4	bebidas	sucos	1	12.99	12.99	12.99	t	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276
a0173b4a-2675-4224-a82f-79e17d3b598f	48147fef-9418-4485-9658-a3538e3011d5	higiene	pasta_dente	1	5.50	5.50	5.50	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
c9c58cae-248e-4465-9daa-0130560a175b	48147fef-9418-4485-9658-a3538e3011d5	cafe	gourmet	1	28.50	28.50	28.50	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
6f2f06c6-0fb2-406f-9ea4-88259317445b	48147fef-9418-4485-9658-a3538e3011d5	verduras	folhas	1	2.50	2.50	2.50	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
efe4c582-5314-4fd9-aa6f-b3c59eeda723	48147fef-9418-4485-9658-a3538e3011d5	laticinios	margarina	1	8.49	8.49	8.49	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
27656d84-7832-46bd-be50-cb8e64de3280	48147fef-9418-4485-9658-a3538e3011d5	higiene	papel_higienico	1	23.90	23.90	23.90	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
374d5a81-f267-4466-a6c1-3096637255f5	48147fef-9418-4485-9658-a3538e3011d5	limpeza	desinfetantes	1	6.75	6.75	6.75	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
72a09148-8b9d-41e2-8e7c-1fbeb43a8488	48147fef-9418-4485-9658-a3538e3011d5	graos	farinha_trigo	1	5.40	5.40	5.40	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
cdcbf29e-8a79-4107-a9b7-ad580feef4db	48147fef-9418-4485-9658-a3538e3011d5	frutas	tropicais	1	4.25	4.25	4.25	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
7f727d09-8697-47ff-b52d-3f6aa165a961	48147fef-9418-4485-9658-a3538e3011d5	higiene	desodorantes	1	13.50	13.50	13.50	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
2a7015bc-8d69-4de5-83a3-0e6e31903b43	48147fef-9418-4485-9658-a3538e3011d5	graos	arroz	1	27.90	27.90	27.90	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
af4355bc-3311-49b7-b6ea-9e64f0462e53	48147fef-9418-4485-9658-a3538e3011d5	biscoitos	salgado	1	3.80	3.80	3.80	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
e674b37b-4691-485c-b072-8db953444f05	48147fef-9418-4485-9658-a3538e3011d5	hortifruti	legumes	1	4.50	4.50	4.50	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
e3fe9668-f57b-496d-8381-245f516bf555	48147fef-9418-4485-9658-a3538e3011d5	bebidas	refrigerantes	2	6.24	4.99	7.49	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
d6cd0bc4-a1e4-460e-90e1-4a1e9aa88227	48147fef-9418-4485-9658-a3538e3011d5	limpeza	sabao_barra	1	6.80	6.80	6.80	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
093ab6a9-9c6d-40c8-845a-639413283351	48147fef-9418-4485-9658-a3538e3011d5	laticinios	condensado	1	7.99	7.99	7.99	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
2f4e38c1-0cb4-4c00-8b5e-b2441c86ab3d	48147fef-9418-4485-9658-a3538e3011d5	frios	presunto	1	7.29	7.29	7.29	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
840995ea-70b4-4caf-ba7a-3acd120f4f51	48147fef-9418-4485-9658-a3538e3011d5	salgadinhos	pipoca	1	2.89	2.89	2.89	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
0f447d42-6632-4ce3-83d0-dc5e6a64d003	48147fef-9418-4485-9658-a3538e3011d5	enlatados	ervilhas	1	2.89	2.89	2.89	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
391d59b3-e070-4f6a-9854-788d1ea4e65c	48147fef-9418-4485-9658-a3538e3011d5	massas	instantaneo	1	1.89	1.89	1.89	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
4f463d5d-4a81-46fe-92ea-f27f4b21a512	48147fef-9418-4485-9658-a3538e3011d5	bebidas	cervejas	2	2.94	2.89	2.99	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
c107aa51-4233-4000-9124-5fb5c3e80cbe	48147fef-9418-4485-9658-a3538e3011d5	limpeza	agua_sanitaria	1	3.99	3.99	3.99	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
3e419a90-ec7e-48ea-a98e-1c45b8ba7dbc	48147fef-9418-4485-9658-a3538e3011d5	biscoitos	maizena	1	5.59	5.59	5.59	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
b57860ee-9acb-4fc5-8510-ca5d509ebf20	48147fef-9418-4485-9658-a3538e3011d5	enlatados	molho_tomate	2	3.65	3.10	4.19	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
4b477352-b929-4e86-8084-9257fb11065b	48147fef-9418-4485-9658-a3538e3011d5	bebidas	aguas	1	2.45	2.45	2.45	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
9c854f31-c934-41e9-a264-3d83b6704dce	48147fef-9418-4485-9658-a3538e3011d5	graos	leguminosas	1	7.25	7.25	7.25	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
18588630-a5d1-4337-980d-509319cfd29b	48147fef-9418-4485-9658-a3538e3011d5	doces	balas	1	2.75	2.75	2.75	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
f7536407-6c69-4298-87b8-ba357121897e	48147fef-9418-4485-9658-a3538e3011d5	laticinios	iogurtes	2	3.44	2.99	3.89	t	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884
6c91ff43-4d1d-4ef0-8ca6-5b5ebe8d78f6	bb9c6b33-adda-4e41-8ecd-99e8090d03cc	panificacao	paes_frescos	1	0.80	0.80	0.80	t	2025-08-01 16:26:31.686261	2025-08-01 16:26:31.686261
c163ed28-e45b-4e7d-beba-2f1ffe50a195	441437a5-5656-4489-8771-8340dc53cb6e	grãos	arroz	1	22.49	22.49	22.49	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
caeb15f7-d6b8-4cb9-8690-b06baf7fd476	441437a5-5656-4489-8771-8340dc53cb6e	grãos	feijao	1	8.99	8.99	8.99	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
e0f6fbd6-83e2-4e3d-a861-0ceeb761cbf9	441437a5-5656-4489-8771-8340dc53cb6e	óleos	soja	1	6.89	6.89	6.89	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
053d6a7d-529e-4f21-9778-260df83d2496	441437a5-5656-4489-8771-8340dc53cb6e	laticínios	leite	1	4.99	4.99	4.99	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
8c0c6485-d21d-49e2-a77d-37f9255421d3	441437a5-5656-4489-8771-8340dc53cb6e	limpeza	detergente	1	2.29	2.29	2.29	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
2e96a58d-c78e-41e3-9664-ebb6ef9e1f69	441437a5-5656-4489-8771-8340dc53cb6e	bebidas	cerveja	1	2.79	2.79	2.79	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
bcb4bd33-c9cf-4423-a7f3-7c96be2fbbf5	441437a5-5656-4489-8771-8340dc53cb6e	bebidas	refrigerante	1	8.49	8.49	8.49	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
c37184ee-2d34-4654-b019-0e02b4563efa	441437a5-5656-4489-8771-8340dc53cb6e	carnes	aves	1	9.49	9.49	9.49	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
2df09036-3e8e-464b-8f7a-b9c11cfc3160	441437a5-5656-4489-8771-8340dc53cb6e	panificação	farinha	1	4.29	4.29	4.29	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
e6031ebd-ed18-4479-abba-edb91444c011	441437a5-5656-4489-8771-8340dc53cb6e	bebidas	café	1	13.49	13.49	13.49	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
d4916138-22cb-4428-85fa-945aed4588f8	441437a5-5656-4489-8771-8340dc53cb6e	higiene	creme_dental	1	3.99	3.99	3.99	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
5c7e10cd-13ee-4759-bea9-70107e83735f	441437a5-5656-4489-8771-8340dc53cb6e	higiene	sabonete	1	2.49	2.49	2.49	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
4d5f07e1-c178-4e29-bf99-77a96e7af140	441437a5-5656-4489-8771-8340dc53cb6e	higiene	papel_higienico	1	17.99	17.99	17.99	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
ca999796-83b2-465b-abf2-4750c897f721	441437a5-5656-4489-8771-8340dc53cb6e	limpeza	sabao_liquido	1	32.90	32.90	32.90	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
9843f887-9f52-4d17-80ad-6fa859ee1763	441437a5-5656-4489-8771-8340dc53cb6e	limpeza	desinfetante	1	4.99	4.99	4.99	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
c55b34e6-7bfc-4d40-9ee0-fc0589a187a0	441437a5-5656-4489-8771-8340dc53cb6e	bebidas	achocolatado	1	7.29	7.29	7.29	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
26698802-6dbb-4de7-8c20-21abe7d7da83	441437a5-5656-4489-8771-8340dc53cb6e	laticínios	queijo	1	22.50	22.50	22.50	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
0824425b-3350-4c40-b3a6-f68f9e95c675	441437a5-5656-4489-8771-8340dc53cb6e	frios	presunto	1	6.99	6.99	6.99	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
92e38b2c-93f2-4ac6-8ad7-454aedb3ab2b	441437a5-5656-4489-8771-8340dc53cb6e	laticínios	iogurte	1	8.49	8.49	8.49	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
68ea81fa-0f94-4bff-b982-a23e62e16d0f	441437a5-5656-4489-8771-8340dc53cb6e	laticínios	margarina	1	6.75	6.75	6.75	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
c998c40a-ef08-4a08-9a02-fc4bafdb4424	441437a5-5656-4489-8771-8340dc53cb6e	biscoitos	doce	1	2.99	2.99	2.99	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
373480be-598e-46e4-bdad-8e794df6a27a	441437a5-5656-4489-8771-8340dc53cb6e	frios	salsicha	1	5.90	5.90	5.90	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
48162be8-c7e2-4937-a797-69dc96dc3e62	441437a5-5656-4489-8771-8340dc53cb6e	limpeza	agua_sanitaria	1	3.39	3.39	3.39	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
ad7fe3ea-8f2f-4d8c-a17a-3cb79808d1a8	441437a5-5656-4489-8771-8340dc53cb6e	congelados	batata	1	25.90	25.90	25.90	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
f03e7d45-c855-422d-8459-c89499de927c	441437a5-5656-4489-8771-8340dc53cb6e	bebidas	suco	1	11.90	11.90	11.90	t	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617
16ec1c33-a567-4861-bdf8-b9e8fc0b84f5	29520ebc-4471-4270-9257-384562aefdce	laticinios	leite	1	5.20	5.20	5.20	t	2025-08-01 16:26:31.763441	2025-08-01 16:26:31.763441
15bc6f50-a426-4647-8487-7f4ec239fefd	29520ebc-4471-4270-9257-384562aefdce	carnes	frango	1	16.90	16.90	16.90	t	2025-08-01 16:26:31.763441	2025-08-01 16:26:31.763441
dd5fbc52-a7a0-46a2-bd33-48dfeddbbda5	29520ebc-4471-4270-9257-384562aefdce	biscoitos	recheado	1	3.99	3.99	3.99	t	2025-08-01 16:26:31.763441	2025-08-01 16:26:31.763441
fee9e71b-b5ff-453e-88d2-78aa345fde13	29520ebc-4471-4270-9257-384562aefdce	cereais	flocos	1	14.20	14.20	14.20	t	2025-08-01 16:26:31.763441	2025-08-01 16:26:31.763441
812613d4-b4ba-478b-a0a0-ff8dcebba07d	29520ebc-4471-4270-9257-384562aefdce	bebidas	refrigerantes	1	7.80	7.80	7.80	t	2025-08-01 16:26:31.763441	2025-08-01 16:26:31.763441
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, market_id, external_id, nome, categoria, subcategoria, preco, loja, endereco, telefone, marca, codigo_barras, peso, origem, estoque, disponivel, promocao, desconto, preco_original, avaliacao, visualizacoes, conversoes, imagem_url, imagens_adicionais, search_vector, data_source, json_source_file, last_updated_from_source, status, created_at, updated_at, created_by, updated_by) FROM stdin;
a9db5230-828b-4ad9-8d27-1dec9903afb6	9e4cdfce-a666-4933-b9f6-6226f78f1be1	142	Sabão em Pó OMO 1kg	limpeza	sabao_po	18.90	Atacadão Franco	Rua das Palmeiras, 789	(11) 4622-9012	OMO	7890000000142	1kg	Nacional	74	t	f	0.00	\N	4.50	2890	867	\N	\N	'1kg':5A 'atacadã':10 'franc':11 'limpez':6B 'omo':4A,9C 'po':8B 'pó':3A 'saba':7B 'sabã':1A	json_import	atacadao_franco.json	2025-08-01 16:26:31.370241	active	2025-08-01 16:26:31.370241	2025-08-01 16:26:31.370241	\N	\N
b03c3e45-aef6-406f-af79-8a8d9f85a10e	9e4cdfce-a666-4933-b9f6-6226f78f1be1	311	Macarrão Espaguete Renata 500g	massas	espaguete	4.25	Atacadão Franco	Rua das Palmeiras, 789	(11) 4622-9012	Renata	7890000000311	500g	Nacional	180	t	f	0.00	\N	4.50	1987	695	\N	\N	'500g':4A 'atacadã':8 'espaguet':2A,6B 'franc':9 'macarrã':1A 'mass':5B 'renat':3A,7C	json_import	atacadao_franco.json	2025-08-01 16:26:31.370241	active	2025-08-01 16:26:31.370241	2025-08-01 16:26:31.370241	\N	\N
99b6749a-6239-40db-89bc-c1b22e79ea65	9e4cdfce-a666-4933-b9f6-6226f78f1be1	362	Pizza Sadia Mussarela 450g	congelados	pizzas	16.90	Atacadão Franco	Rua das Palmeiras, 789	(11) 4622-9012	Sadia	7890000000362	450g	Nacional	58	t	t	25.00	\N	4.20	2134	747	\N	\N	'450g':4A 'atacadã':8 'congel':5B 'franc':9 'mussarel':3A 'pizz':1A,6B 'sad':2A,7C	json_import	atacadao_franco.json	2025-08-01 16:26:31.370241	active	2025-08-01 16:26:31.370241	2025-08-01 16:26:31.370241	\N	\N
01b1403d-512b-48e2-a918-387d5a3d2241	9e4cdfce-a666-4933-b9f6-6226f78f1be1	411	Picanha Bovina 1kg	carnes	bovina	79.90	Atacadão Franco	Rua das Palmeiras, 789	(11) 4622-9012	Friboi	7890000000411	1kg	Nacional	22	t	f	0.00	\N	4.80	892	312	\N	\N	'1kg':3A 'atacadã':7 'bovin':2A,5B 'carn':4B 'franc':8 'fribo':6C 'picanh':1A	json_import	atacadao_franco.json	2025-08-01 16:26:31.370241	active	2025-08-01 16:26:31.370241	2025-08-01 16:26:31.370241	\N	\N
a087b1e6-0eee-481f-afad-fe732c099618	9e4cdfce-a666-4933-b9f6-6226f78f1be1	472	Biscoito Cream Cracker Bauducco 200g	biscoitos	salgado	3.50	Atacadão Franco	Rua das Palmeiras, 789	(11) 4622-9012	Bauducco	7890000000417	200g	Nacional	110	t	f	0.00	\N	4.20	1700	600	\N	\N	'200g':5A 'atacadã':9 'bauducc':4A,8C 'biscoit':1A,6B 'crack':3A 'cre':2A 'franc':10 'salg':7B	json_import	atacadao_franco.json	2025-08-01 16:26:31.370241	active	2025-08-01 16:26:31.370241	2025-08-01 16:26:31.370241	\N	\N
dccae1e0-420f-4dfc-8fec-35b5ce81c0e8	1c5802cc-cf00-4989-b21a-e4e6b35e6918	2	Coca Cola 600ml	bebidas	refrigerantes	6.99	Extra Franco	Av. São Paulo, 456	(11) 4622-5678	Coca-Cola	7894900010002	600ml	Nacional	89	t	t	10.00	\N	4.30	1892	634	\N	\N	'600ml':3A 'beb':4B 'coc':1A,7C 'coca-col':6C 'col':2A,8C 'extra':9 'franc':10 'refriger':5B	json_import	extra_franco.json	2025-08-01 16:26:31.410889	active	2025-08-01 16:26:31.410889	2025-08-01 16:26:31.410889	\N	\N
25eff37b-7ae2-4352-b04f-5c37d4397596	1c5802cc-cf00-4989-b21a-e4e6b35e6918	141	Detergente Líquido Ypê 500ml	limpeza	detergentes	2.79	Extra Franco	Av. São Paulo, 456	(11) 4622-5678	Ypê	7890000000141	500ml	Nacional	210	t	t	20.00	\N	4.40	3450	1552	\N	\N	'500ml':4A 'detergent':1A,6B 'extra':8 'franc':9 'limpez':5B 'líqu':2A 'ypê':3A,7C	json_import	extra_franco.json	2025-08-01 16:26:31.410889	active	2025-08-01 16:26:31.410889	2025-08-01 16:26:31.410889	\N	\N
fdc3472e-3274-4dee-94da-5518c40088d5	1c5802cc-cf00-4989-b21a-e4e6b35e6918	312	Massa para Lasanha 500g	massas	lasanha	8.90	Extra Franco	Av. São Paulo, 456	(11) 4622-5678	Adria	7890000000312	500g	Nacional	75	t	t	10.00	\N	4.20	1234	432	\N	\N	'500g':4A 'adri':7C 'extra':8 'franc':9 'lasanh':3A,6B 'mass':1A,5B	json_import	extra_franco.json	2025-08-01 16:26:31.410889	active	2025-08-01 16:26:31.410889	2025-08-01 16:26:31.410889	\N	\N
6777f65c-4ff8-4487-83ca-de3836d7f65e	1c5802cc-cf00-4989-b21a-e4e6b35e6918	363	Chocolate Lacta 90g	doces	chocolates	4.75	Extra Franco	Av. São Paulo, 456	(11) 4622-5678	Lacta	7890000000363	90g	Nacional	120	t	f	0.00	\N	4.90	2987	1045	\N	\N	'90g':3A 'chocolat':1A,5B 'doc':4B 'extra':7 'franc':8 'lact':2A,6C	json_import	extra_franco.json	2025-08-01 16:26:31.410889	active	2025-08-01 16:26:31.410889	2025-08-01 16:26:31.410889	\N	\N
01b83734-7752-4829-9825-949def16c603	1c5802cc-cf00-4989-b21a-e4e6b35e6918	412	Alcatra em Bife 1kg	carnes	bovina	59.90	Extra Franco	Av. São Paulo, 456	(11) 4622-5678	Frisa	7890000000412	1kg	Nacional	30	t	t	10.00	\N	4.70	745	278	\N	\N	'1kg':4A 'alcatr':1A 'bif':3A 'bovin':6B 'carn':5B 'extra':8 'franc':9 'fris':7C	json_import	extra_franco.json	2025-08-01 16:26:31.410889	active	2025-08-01 16:26:31.410889	2025-08-01 16:26:31.410889	\N	\N
e68e233d-2ad0-4190-b072-975391bf2a17	1c5802cc-cf00-4989-b21a-e4e6b35e6918	470	Batata Kg	hortifruti	legumes	5.20	Extra Franco	Av. São Paulo, 456	(11) 4622-5678		7890000000415	1kg	Nacional	80	t	t	5.00	\N	4.40	2100	700	\N	\N	'batat':1A 'extra':5 'franc':6 'hortifrut':3B 'kg':2A 'legum':4B	json_import	extra_franco.json	2025-08-01 16:26:31.410889	active	2025-08-01 16:26:31.410889	2025-08-01 16:26:31.410889	\N	\N
88e4e175-75e8-4768-ba27-4b3758c42ad8	ff51ca83-c8da-42f4-adfc-a7dd491e1896	12	Suco Del Vale Uva 1L	bebidas	sucos	9.90	Hiper Franco	Rod. Pres. Castelo Branco, 1200	(11) 4622-8888	Del Vale	7890000000012	1L	Nacional	85	t	t	15.00	\N	4.40	1789	625	\N	\N	'1l':5A 'beb':6B 'del':2A,8C 'franc':11 'hip':10 'suc':1A,7B 'uva':4A 'val':3A,9C	json_import	hiper_franco.json	2025-08-01 16:26:31.428626	active	2025-08-01 16:26:31.428626	2025-08-01 16:26:31.428626	\N	\N
0a438dfe-20ba-46d2-aa2c-0de1dd4b1af8	ff51ca83-c8da-42f4-adfc-a7dd491e1896	81	Arroz Branco Tipo 1 5kg	graos	arroz	26.75	Hiper Franco	Rod. Pres. Castelo Branco, 1200	(11) 4622-8888	Tio João	7890000000081	5kg	Nacional	120	t	t	12.00	\N	4.70	2105	843	\N	\N	'1':4A '5kg':5A 'arroz':1A,7B 'branc':2A 'franc':11 'gra':6B 'hip':10 'joã':9C 'tio':8C 'tip':3A	json_import	hiper_franco.json	2025-08-01 16:26:31.428626	active	2025-08-01 16:26:31.428626	2025-08-01 16:26:31.428626	\N	\N
87222e24-ab12-48b9-a415-297f0a424204	ff51ca83-c8da-42f4-adfc-a7dd491e1896	357	Óleo de Soja Liza 900ml	oleos	soja	8.90	Hiper Franco	Rod. Pres. Castelo Branco, 1200	(11) 4622-8888	Liza	7890000000357	900ml	Nacional	120	t	t	12.00	\N	4.50	2876	1006	\N	\N	'900ml':5A 'franc':10 'hip':9 'liz':4A,8C 'ole':6B 'soj':3A,7B 'óle':1A	json_import	hiper_franco.json	2025-08-01 16:26:31.428626	active	2025-08-01 16:26:31.428626	2025-08-01 16:26:31.428626	\N	\N
6fd733d1-ec1a-4587-a33f-fde459295328	ff51ca83-c8da-42f4-adfc-a7dd491e1896	365	Atum Gomes da Costa 170g	enlatados	atum	8.30	Hiper Franco	Rod. Pres. Castelo Branco, 1200	(11) 4622-8888	Gomes da Costa	7890000000365	170g	Nacional	85	t	t	10.00	\N	4.60	1543	540	\N	\N	'170g':5A 'atum':1A,7B 'cost':4A,10C 'enlat':6B 'franc':12 'gom':2A,8C 'hip':11	json_import	hiper_franco.json	2025-08-01 16:26:31.428626	active	2025-08-01 16:26:31.428626	2025-08-01 16:26:31.428626	\N	\N
e48f3597-6367-41f4-ba7b-7d448b9abecd	ff51ca83-c8da-42f4-adfc-a7dd491e1896	410	Vinho Tinto Chileno 750ml	bebidas	vinhos	39.90	Hiper Franco	Rod. Pres. Castelo Branco, 1200	(11) 4622-8888	Concha y Toro	7890000000410	750ml	Importado	24	t	t	30.00	\N	4.70	876	263	\N	\N	'750ml':4A 'beb':5B 'chilen':3A 'conch':7C 'franc':11 'hip':10 'tint':2A 'tor':9C 'vinh':1A,6B 'y':8C	json_import	hiper_franco.json	2025-08-01 16:26:31.428626	active	2025-08-01 16:26:31.428626	2025-08-01 16:26:31.428626	\N	\N
9cf88b5a-9386-40e1-94db-2c2a493514d9	ff51ca83-c8da-42f4-adfc-a7dd491e1896	415	Cerveja Stella Artois 550ml	bebidas	cervejas	7.90	Hiper Franco	Rod. Pres. Castelo Branco, 1200	(11) 4622-8888	Stella Artois	7890000000415	550ml	Importado	60	t	t	10.00	\N	4.80	1143	502	\N	\N	'550ml':4A 'arto':3A,8C 'beb':5B 'cervej':1A,6B 'franc':10 'hip':9 'stell':2A,7C	json_import	hiper_franco.json	2025-08-01 16:26:31.428626	active	2025-08-01 16:26:31.428626	2025-08-01 16:26:31.428626	\N	\N
e26620eb-53a1-4424-9650-81f8cd671f52	ff51ca83-c8da-42f4-adfc-a7dd491e1896	471	Café Solúvel Nescafé Clássico 200g	cafe	soluvel	18.90	Hiper Franco	Rod. Pres. Castelo Branco, 1200	(11) 4622-8888	Nescafé	7890000000416	200g	Nacional	60	t	f	0.00	\N	4.30	1600	550	\N	\N	'200g':5A 'caf':1A,6B 'clássic':4A 'franc':10 'hip':9 'nescaf':3A,8C 'soluvel':7B 'solúvel':2A	json_import	hiper_franco.json	2025-08-01 16:26:31.428626	active	2025-08-01 16:26:31.428626	2025-08-01 16:26:31.428626	\N	\N
a8099d5f-0b28-4a9a-a88e-4913b4bbd885	bdb617e6-d49e-4223-b549-01fb68c923ed	600	Coca Cola 2L	bebidas	bebidas	2.80	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Coca	7890000001109	2L	Nacional	196	t	f	5.00	\N	4.60	3873	635	\N	\N	'2l':3A 'beb':4B,5B 'bel':9 'coc':1A,6C 'col':2A 'mercadinh':7 'vil':8	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
fccec957-e535-4fd1-8124-4280e2764693	bdb617e6-d49e-4223-b549-01fb68c923ed	601	Suco de Laranja Natural One 1L	bebidas	bebidas	32.60	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Suco	7890000001961	1L	Nacional	141	t	t	20.00	\N	4.80	2535	823	\N	\N	'1l':6A 'beb':7B,8B 'bel':12 'laranj':3A 'mercadinh':10 'natural':4A 'one':5A 'suc':1A,9C 'vil':11	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
a46738f9-1636-4494-9fbe-d9eac5ab1a67	bdb617e6-d49e-4223-b549-01fb68c923ed	602	Água Mineral Minalba 1.5L	bebidas	bebidas	32.56	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Água	7890000001925	1.5L	Nacional	81	t	f	25.00	\N	4.50	2107	398	\N	\N	'1.5':4A 'beb':6B,7B 'bel':11 'l':5A 'mercadinh':9 'minalb':3A 'mineral':2A 'vil':10 'águ':1A,8C	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
0ea9c69e-b9ab-48f4-acc1-8ad21229474b	bdb617e6-d49e-4223-b549-01fb68c923ed	603	Cerveja Skol 350ml	bebidas	bebidas	12.63	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Cerveja	7890000001310	350ml	Nacional	158	t	f	10.00	\N	4.80	1171	360	\N	\N	'350ml':3A 'beb':4B,5B 'bel':9 'cervej':1A,6C 'mercadinh':7 'skol':2A 'vil':8	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
e270e45d-66d5-4949-a301-5aea6bfe63d5	bdb617e6-d49e-4223-b549-01fb68c923ed	604	Chá Verde Leão 300ml	bebidas	bebidas	9.00	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Chá	7890000001823	300ml	Importado	146	t	f	0.00	\N	4.60	2683	1332	\N	\N	'300ml':4A 'beb':5B,6B 'bel':10 'chá':1A,7C 'leã':3A 'mercadinh':8 'verd':2A 'vil':9	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
93c35539-43fc-4bfc-b555-c43269bfb364	bdb617e6-d49e-4223-b549-01fb68c923ed	605	Arroz Tio João 5kg	graos	graos	10.53	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Arroz	7890000001878	5kg	Local	76	t	t	25.00	\N	4.20	1338	1500	\N	\N	'5kg':4A 'arroz':1A,7C 'bel':10 'gra':5B,6B 'joã':3A 'mercadinh':8 'tio':2A 'vil':9	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
ac2b59f2-0f1b-46b2-83e3-046334a8a937	bdb617e6-d49e-4223-b549-01fb68c923ed	606	Feijão Carioca Kicaldo 1kg	graos	graos	3.79	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Feijão	7890000001133	1kg	Importado	46	t	t	5.00	\N	4.40	3245	315	\N	\N	'1kg':4A 'bel':10 'carioc':2A 'feijã':1A,7C 'gra':5B,6B 'kicald':3A 'mercadinh':8 'vil':9	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
d67bb28b-158c-415a-8486-65086ce653dd	bdb617e6-d49e-4223-b549-01fb68c923ed	607	Lentilha Yoki 500g	graos	graos	19.33	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Lentilha	7890000001387	500g	Nacional	169	t	t	15.00	\N	4.40	1557	1182	\N	\N	'500g':3A 'bel':9 'gra':4B,5B 'lentilh':1A,6C 'mercadinh':7 'vil':8 'yok':2A	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
4e102e84-95de-48f9-97cd-8baa93f00878	bdb617e6-d49e-4223-b549-01fb68c923ed	608	Farinha de Trigo Dona Benta 1kg	graos	graos	6.27	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Farinha	7890000001127	1kg	Local	25	t	f	10.00	\N	4.60	1686	698	\N	\N	'1kg':6A 'bel':12 'bent':5A 'don':4A 'farinh':1A,9C 'gra':7B,8B 'mercadinh':10 'trig':3A 'vil':11	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
34585ed3-5cf0-42c5-90d4-8017bd0bd62c	bdb617e6-d49e-4223-b549-01fb68c923ed	609	Milho para Pipoca Yoki 500g	graos	graos	5.10	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Milho	7890000001606	500g	Importado	78	t	t	20.00	\N	4.40	1360	1473	\N	\N	'500g':5A 'bel':11 'gra':6B,7B 'mercadinh':9 'milh':1A,8C 'pipoc':3A 'vil':10 'yok':4A	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
77b8ed79-1b64-4449-a975-d5cb0677dbdc	bdb617e6-d49e-4223-b549-01fb68c923ed	610	Leite UHT Itambé 1L	laticinios	laticinios	9.46	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Leite	7890000001418	1L	Nacional	20	t	t	25.00	\N	4.50	2574	1266	\N	\N	'1l':4A 'bel':10 'itamb':3A 'laticini':5B,6B 'leit':1A,7C 'mercadinh':8 'uht':2A 'vil':9	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
8365d863-da01-4ba2-bc64-9702e52025e7	bdb617e6-d49e-4223-b549-01fb68c923ed	611	Iogurte Nestlé 170g	laticinios	laticinios	20.76	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Iogurte	7890000001988	170g	Importado	20	t	f	0.00	\N	4.80	2339	730	\N	\N	'170g':3A 'bel':9 'iogurt':1A,6C 'laticini':4B,5B 'mercadinh':7 'nestl':2A 'vil':8	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
3c98d1d7-27a5-4e6c-991d-3cace0f9ed3e	bdb617e6-d49e-4223-b549-01fb68c923ed	612	Margarina Qualy 500g	laticinios	laticinios	4.29	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Margarina	7890000001394	500g	Local	32	t	t	15.00	\N	4.80	2189	525	\N	\N	'500g':3A 'bel':9 'laticini':4B,5B 'margarin':1A,6C 'mercadinh':7 'qualy':2A 'vil':8	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
6865fd59-663f-4883-8303-632d1ca3c79a	bdb617e6-d49e-4223-b549-01fb68c923ed	613	Queijo Mussarela 500g	laticinios	laticinios	22.96	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Queijo	7890000001126	500g	Local	169	t	f	0.00	\N	4.40	3054	762	\N	\N	'500g':3A 'bel':9 'laticini':4B,5B 'mercadinh':7 'mussarel':2A 'queij':1A,6C 'vil':8	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
6af89da4-9cae-4472-9120-85317ec98046	bdb617e6-d49e-4223-b549-01fb68c923ed	614	Leite Condensado Moça 395g	laticinios	laticinios	7.78	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Leite	7890000001295	395g	Nacional	167	t	t	10.00	\N	4.40	3569	352	\N	\N	'395g':4A 'bel':10 'condens':2A 'laticini':5B,6B 'leit':1A,7C 'mercadinh':8 'moc':3A 'vil':9	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
b18d6853-3147-48a5-b184-98984271596e	bdb617e6-d49e-4223-b549-01fb68c923ed	615	Sabão em Pó OMO 1kg	limpeza	limpeza	8.55	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Sabão	7890000001465	1kg	Nacional	125	t	f	10.00	\N	4.20	2935	1057	\N	\N	'1kg':5A 'bel':11 'limpez':6B,7B 'mercadinh':9 'omo':4A 'pó':3A 'sabã':1A,8C 'vil':10	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
4f56d3ec-917a-4937-9bec-4ee04c656b86	bdb617e6-d49e-4223-b549-01fb68c923ed	616	Detergente Ypê 500ml	limpeza	limpeza	30.53	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Detergente	7890000001856	500ml	Nacional	126	t	t	20.00	\N	4.60	2100	223	\N	\N	'500ml':3A 'bel':9 'detergent':1A,6C 'limpez':4B,5B 'mercadinh':7 'vil':8 'ypê':2A	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
c3ce267a-9007-4c13-b71c-d4cfd0cd6ab1	bdb617e6-d49e-4223-b549-01fb68c923ed	617	Desinfetante Veja 500ml	limpeza	limpeza	21.02	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Desinfetante	7890000001400	500ml	Importado	26	t	f	25.00	\N	4.80	853	764	\N	\N	'500ml':3A 'bel':9 'desinfet':1A,6C 'limpez':4B,5B 'mercadinh':7 'vej':2A 'vil':8	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
c17cef08-4afd-4b2b-8cb7-385bb904c790	bdb617e6-d49e-4223-b549-01fb68c923ed	618	Sabão em Barra Minuano 5un	limpeza	limpeza	20.52	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Sabão	7890000001487	5un	Local	90	t	f	20.00	\N	4.60	2048	747	\N	\N	'5un':5A 'barr':3A 'bel':11 'limpez':6B,7B 'mercadinh':9 'minuan':4A 'sabã':1A,8C 'vil':10	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
088162a8-9baa-456a-8e18-acd0c7eada17	bdb617e6-d49e-4223-b549-01fb68c923ed	619	Água Sanitária Qboa 1L	limpeza	limpeza	11.13	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Água	7890000001495	1L	Nacional	180	t	f	0.00	\N	4.80	3142	351	\N	\N	'1l':4A 'bel':10 'limpez':5B,6B 'mercadinh':8 'qbo':3A 'sanitár':2A 'vil':9 'águ':1A,7C	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
7f0e3e9d-13da-418e-ba98-dd3bd744fa6d	bdb617e6-d49e-4223-b549-01fb68c923ed	620	Shampoo Seda 325ml	higiene	higiene	33.04	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Shampoo	7890000001944	325ml	Local	198	t	t	5.00	\N	4.20	3840	1391	\N	\N	'325ml':3A 'bel':9 'higien':4B,5B 'mercadinh':7 'sed':2A 'shampo':1A,6C 'vil':8	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
3d0740d5-7400-4a66-8b9d-b811a21d58b2	bdb617e6-d49e-4223-b549-01fb68c923ed	621	Desodorante Rexona 150ml	higiene	higiene	11.73	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Desodorante	7890000001577	150ml	Importado	88	t	t	20.00	\N	4.60	1156	114	\N	\N	'150ml':3A 'bel':9 'desodor':1A,6C 'higien':4B,5B 'mercadinh':7 'rexon':2A 'vil':8	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
7b07d066-3f96-4ab0-b3ba-5f54aad4f01f	bdb617e6-d49e-4223-b549-01fb68c923ed	622	Sabonete Dove 90g	higiene	higiene	18.08	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Sabonete	7890000001141	90g	Importado	168	t	t	15.00	\N	4.30	3668	238	\N	\N	'90g':3A 'bel':9 'dov':2A 'higien':4B,5B 'mercadinh':7 'sabonet':1A,6C 'vil':8	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
4ef5cc69-ed07-4db6-8db7-c8090b6c7aa0	bdb617e6-d49e-4223-b549-01fb68c923ed	623	Creme Dental Colgate 90g	higiene	higiene	27.29	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Creme	7890000001832	90g	Nacional	184	t	f	0.00	\N	4.40	3925	161	\N	\N	'90g':4A 'bel':10 'colgat':3A 'crem':1A,7C 'dental':2A 'higien':5B,6B 'mercadinh':8 'vil':9	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
03c3fdb2-3f79-4623-ad18-b244cd57b153	bdb617e6-d49e-4223-b549-01fb68c923ed	624	Papel Higiênico Neve 12un	higiene	higiene	22.77	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Papel	7890000001709	12un	Local	48	t	f	0.00	\N	4.60	2098	1120	\N	\N	'12un':4A 'bel':10 'higien':5B,6B 'higiên':2A 'mercadinh':8 'nev':3A 'papel':1A,7C 'vil':9	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
22bac413-2cc6-4f76-9137-f580eb9f1bf4	bdb617e6-d49e-4223-b549-01fb68c923ed	625	Tomate Kg	hortifruti	hortifruti	16.38	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Tomate	7890000001564	Kg	Importado	106	t	f	0.00	\N	4.50	1650	212	\N	\N	'bel':8 'hortifrut':3B,4B 'kg':2A 'mercadinh':6 'tomat':1A,5C 'vil':7	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
463aaf85-0ef9-4273-89ca-9aae2e387ae7	bdb617e6-d49e-4223-b549-01fb68c923ed	626	Cebola Kg	hortifruti	hortifruti	4.72	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Cebola	7890000001666	Kg	Importado	169	t	f	25.00	\N	4.50	2515	1158	\N	\N	'bel':8 'cebol':1A,5C 'hortifrut':3B,4B 'kg':2A 'mercadinh':6 'vil':7	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
7bc0d88d-7807-4729-997d-ba5ba988a998	bdb617e6-d49e-4223-b549-01fb68c923ed	627	Batata Kg	hortifruti	hortifruti	26.31	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Batata	7890000001259	Kg	Nacional	30	t	f	10.00	\N	4.40	2767	1091	\N	\N	'batat':1A,5C 'bel':8 'hortifrut':3B,4B 'kg':2A 'mercadinh':6 'vil':7	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
d8803cfe-7f6f-4d44-b4eb-5333b03cd75a	bdb617e6-d49e-4223-b549-01fb68c923ed	628	Banana Prata Kg	hortifruti	hortifruti	30.92	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Banana	7890000001444	Kg	Nacional	51	t	t	5.00	\N	4.80	580	1404	\N	\N	'banan':1A,6C 'bel':9 'hortifrut':4B,5B 'kg':3A 'mercadinh':7 'prat':2A 'vil':8	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
bc447c3c-64fd-46ec-9f31-721d77d14815	bdb617e6-d49e-4223-b549-01fb68c923ed	629	Maçã Gala Kg	hortifruti	hortifruti	22.60	Mercadinho Vila Bela	Rua das Violetas, 789	(11) 4622-9999	Maçã	7890000001614	Kg	Local	58	t	f	10.00	\N	4.40	2356	311	\N	\N	'bel':9 'gal':2A 'hortifrut':4B,5B 'kg':3A 'maçã':1A,6C 'mercadinh':7 'vil':8	json_import	mercadinho_vila_bela.json	2025-08-01 16:26:31.449965	active	2025-08-01 16:26:31.449965	2025-08-01 16:26:31.449965	\N	\N
5899c8ab-efb8-4fab-828f-9f20c7d14fb4	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	479	Açúcar Cristal União 1kg	graos	acucar	4.29	Mercado 120	Av Arco-iris, 968	(11) 4622-1234	União	7890000000479	1kg	Nacional	179	t	f	0.00	\N	4.40	1966	1139	\N	\N	'120':9 '1kg':4A 'acuc':6B 'açúc':1A 'cristal':2A 'gra':5B 'merc':8 'uniã':3A,7C	json_import	mercado_120.json	2025-08-01 16:26:31.509146	active	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146	\N	\N
21b08b54-9ac1-4ba9-9bd0-a1b0fc8c6588	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	481	Maionese Hellmann's 500g	condimentos	maionese	9.99	Mercado 120	Av Arco-iris, 968	(11) 4622-1234	Hellmann's	7890000000481	500g	Nacional	141	t	f	0.00	\N	4.40	2420	279	\N	\N	'120':10 '500g':4A 'condiment':5B 'hellmann':2A,7C 'maiones':1A,6B 'merc':9 's':3A,8C	json_import	mercado_120.json	2025-08-01 16:26:31.509146	active	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146	\N	\N
3ea30d18-32ea-4863-97fe-0bd3c6ad8ed3	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	482	Tomate Italiano Kg	hortifruti	legumes	5.99	Mercado 120	Av Arco-iris, 968	(11) 4622-1234		7890000000482	1kg	Nacional	96	t	f	0.00	\N	4.60	2922	1307	\N	\N	'120':7 'hortifrut':4B 'italian':2A 'kg':3A 'legum':5B 'merc':6 'tomat':1A	json_import	mercado_120.json	2025-08-01 16:26:31.509146	active	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146	\N	\N
f7845c59-6aae-49ed-bea1-9a2868f9b1fa	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	483	Batata Monalisa Kg	hortifruti	legumes	4.59	Mercado 120	Av Arco-iris, 968	(11) 4622-1234		7890000000483	1kg	Nacional	114	t	f	0.00	\N	4.40	2064	532	\N	\N	'120':7 'batat':1A 'hortifrut':4B 'kg':3A 'legum':5B 'merc':6 'monalis':2A	json_import	mercado_120.json	2025-08-01 16:26:31.509146	active	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146	\N	\N
c7867ec7-2460-4ff3-ac26-aa2909530492	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	484	Cebola Branca Kg	hortifruti	legumes	3.49	Mercado 120	Av Arco-iris, 968	(11) 4622-1234		7890000000484	1kg	Nacional	189	t	f	0.00	\N	4.70	2049	439	\N	\N	'120':7 'branc':2A 'cebol':1A 'hortifrut':4B 'kg':3A 'legum':5B 'merc':6	json_import	mercado_120.json	2025-08-01 16:26:31.509146	active	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146	\N	\N
95d725b0-c3fd-4494-a5c4-daa722477dfa	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	485	Feijão Preto Camil 1kg	graos	feijao	8.49	Mercado 120	Av Arco-iris, 968	(11) 4622-1234	Camil	7890000000485	1kg	Nacional	184	t	f	0.00	\N	4.20	1214	620	\N	\N	'120':9 '1kg':4A 'camil':3A,7C 'feija':6B 'feijã':1A 'gra':5B 'merc':8 'pret':2A	json_import	mercado_120.json	2025-08-01 16:26:31.509146	active	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146	\N	\N
5b848192-f4cd-45aa-aa2f-af6f20490619	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	486	Creme Dental Colgate 90g	higiene	creme_dental	3.99	Mercado 120	Av Arco-iris, 968	(11) 4622-1234	Colgate	7890000000486	90g	Nacional	40	t	f	0.00	\N	4.90	2677	537	\N	\N	'120':10 '90g':4A 'colgat':3A,8C 'crem':1A,6B 'dental':2A,7B 'higien':5B 'merc':9	json_import	mercado_120.json	2025-08-01 16:26:31.509146	active	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146	\N	\N
d953f505-e5f6-42dc-8c4e-8f4298ca90f4	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	498	Papel Alumínio Wyda 7,5m	limpeza	descartaveis	7.49	Mercado 120	Av Arco-iris, 968	(11) 4622-1234	Wyda	7890000000498	7.5m	Nacional	32	t	f	5.00	\N	4.60	798	331	\N	\N	'120':10 '5m':5A '7':4A 'alumíni':2A 'descartav':7B 'limpez':6B 'merc':9 'papel':1A 'wyda':3A,8C	json_import	mercado_120.json	2025-08-01 16:26:31.509146	active	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146	\N	\N
0f967a20-2fca-44e3-b437-bd0c90c3cd1e	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	500	Chá Matte Leão 25g	bebidas	cha	4.99	Mercado 120	Av Arco-iris, 968	(11) 4622-1234	Leão	7890000000500	25g	Nacional	135	t	t	10.00	\N	4.90	1625	248	\N	\N	'120':9 '25g':4A 'beb':5B 'cha':6B 'chá':1A 'leã':3A,7C 'matt':2A 'merc':8	json_import	mercado_120.json	2025-08-01 16:26:31.509146	active	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146	\N	\N
16631cb2-fa79-4986-92f8-b63016fcdeac	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	503	Doce de Leite Itambé 400g	doces	doce_leite	8.29	Mercado 120	Av Arco-iris, 968	(11) 4622-1234	Itambé	7890000000503	400g	Nacional	46	t	f	0.00	\N	4.40	2995	171	\N	\N	'120':11 '400g':5A 'doc':1A,6B,7B 'itamb':4A,9C 'leit':3A,8B 'merc':10	json_import	mercado_120.json	2025-08-01 16:26:31.509146	active	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146	\N	\N
f6053b20-91c7-4007-a532-706134b5d9b3	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	504	Desinfetante Pinho Sol 500ml	limpeza	desinfetantes	5.29	Mercado 120	Av Arco-iris, 968	(11) 4622-1234	Pinho Sol	7890000000504	500ml	Nacional	182	t	f	0.00	\N	4.10	548	1346	\N	\N	'120':10 '500ml':4A 'desinfet':1A,6B 'limpez':5B 'merc':9 'pinh':2A,7C 'sol':3A,8C	json_import	mercado_120.json	2025-08-01 16:26:31.509146	active	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146	\N	\N
2121298d-c724-4242-aec9-600a169d313e	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	510	Cenoura Kg	hortifruti	legumes	3.99	Mercado 120	Av Arco-iris, 968	(11) 4622-1234		7890000000510	1kg	Nacional	163	t	t	15.00	\N	4.20	2311	1494	\N	\N	'120':6 'cenour':1A 'hortifrut':3B 'kg':2A 'legum':4B 'merc':5	json_import	mercado_120.json	2025-08-01 16:26:31.509146	active	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146	\N	\N
954b76e5-d349-41e3-806d-42ced1bef474	f28e38f6-6e78-4fb0-9a5a-28e7a143b8b4	515	Salsicha Hot Dog Perdigão 500g	frios	salsichas	6.49	Mercado 120	Av Arco-iris, 968	(11) 4622-1234	Perdigão	7890000000515	500g	Nacional	164	t	t	10.00	\N	4.80	1202	290	\N	\N	'120':10 '500g':5A 'dog':3A 'fri':6B 'hot':2A 'merc':9 'perdigã':4A,8C 'salsich':1A,7B	json_import	mercado_120.json	2025-08-01 16:26:31.509146	active	2025-08-01 16:26:31.509146	2025-08-01 16:26:31.509146	\N	\N
febe883e-7ad1-4253-a01e-396df3c9465c	003bbaf7-5c5f-4618-80bc-027fc90fb7d5	192	Queijo Mussarela Fresco 500g	laticinios	queijo	22.70	Mercado Central Franco	Rua Central, 321	(11) 4622-3456	Polenghi	7890000000192	500g	Nacional	65	t	t	10.00	\N	4.70	2345	820	\N	\N	'500g':4A 'central':9 'franc':10 'fresc':3A 'laticini':5B 'merc':8 'mussarel':2A 'polengh':7C 'queij':1A,6B	json_import	mercado_central_franco.json	2025-08-01 16:26:31.539415	active	2025-08-01 16:26:31.539415	2025-08-01 16:26:31.539415	\N	\N
06c88701-fba6-4c31-837e-c747ca459d2c	003bbaf7-5c5f-4618-80bc-027fc90fb7d5	282	Contrafilé Bovino Bife 1kg	carnes	bovina	42.50	Mercado Central Franco	Rua Central, 321	(11) 4622-3456	Friboi	7890000000282	1kg	Nacional	28	t	f	0.00	\N	4.80	1789	536	\N	\N	'1kg':4A 'bif':3A 'bovin':2A,6B 'carn':5B 'central':9 'contrafil':1A 'franc':10 'fribo':7C 'merc':8	json_import	mercado_central_franco.json	2025-08-01 16:26:31.539415	active	2025-08-01 16:26:31.539415	2025-08-01 16:26:31.539415	\N	\N
3b7a2591-e29c-4ec3-9f25-8e0e3aedb288	003bbaf7-5c5f-4618-80bc-027fc90fb7d5	359	Pão de Forma Pullman 500g	paes	forma	12.50	Mercado Central Franco	Rua Central, 321	(11) 4622-3456	Pullman	7890000000359	500g	Nacional	60	t	t	15.00	\N	4.60	1567	548	\N	\N	'500g':5A 'central':10 'form':3A,7B 'franc':11 'merc':9 'paes':6B 'pullman':4A,8C 'pã':1A	json_import	mercado_central_franco.json	2025-08-01 16:26:31.539415	active	2025-08-01 16:26:31.539415	2025-08-01 16:26:31.539415	\N	\N
29ead029-8e2d-4d74-abf8-7cef8cdbc0f7	003bbaf7-5c5f-4618-80bc-027fc90fb7d5	367	Salgadinho Cheetos 80g	petiscos	salgadinhos	4.99	Mercado Central Franco	Rua Central, 321	(11) 4622-3456	Cheetos	7890000000367	80g	Nacional	110	t	t	20.00	\N	4.10	2876	1006	\N	\N	'80g':3A 'central':8 'cheet':2A,6C 'franc':9 'merc':7 'petisc':4B 'salgadinh':1A,5B	json_import	mercado_central_franco.json	2025-08-01 16:26:31.539415	active	2025-08-01 16:26:31.539415	2025-08-01 16:26:31.539415	\N	\N
60d9503c-c991-4e3f-b000-3b24407f9b98	003bbaf7-5c5f-4618-80bc-027fc90fb7d5	413	Cerveja Heineken Long Neck 330ml	bebidas	cervejas	5.99	Mercado Central Franco	Rua Central, 321	(11) 4622-3456	Heineken	7890000000413	330ml	Importado	85	t	t	15.00	\N	4.90	1380	654	\N	\N	'330ml':5A 'beb':6B 'central':10 'cervej':1A,7B 'franc':11 'heineken':2A,8C 'long':3A 'merc':9 'neck':4A	json_import	mercado_central_franco.json	2025-08-01 16:26:31.539415	active	2025-08-01 16:26:31.539415	2025-08-01 16:26:31.539415	\N	\N
19abd7bd-69e8-4284-91d1-6ba5301868a9	003bbaf7-5c5f-4618-80bc-027fc90fb7d5	474	Azeite Extra Virgem Gallo 500ml	oleos	azeite	29.90	Mercado Central Franco	Rua Central, 321	(11) 4622-3456	Gallo	7890000000419	500ml	Portugal	40	t	f	0.00	\N	4.80	1000	350	\N	\N	'500ml':5A 'azeit':1A,7B 'central':10 'extra':2A 'franc':11 'gall':4A,8C 'merc':9 'ole':6B 'virg':3A	json_import	mercado_central_franco.json	2025-08-01 16:26:31.539415	active	2025-08-01 16:26:31.539415	2025-08-01 16:26:31.539415	\N	\N
80b0ac40-60ea-4e66-8b7e-943a4874ff34	e2ed6490-e930-44b6-89db-40d2ce1b8ab5	11	Água Mineral Bonafont 1.5L	bebidas	aguas	3.20	Mercado da Família	Rua das Flores, 234	(11) 4622-7777	Bonafont	7890000000011	1.5L	Nacional	200	t	f	0.00	\N	4.80	3250	1300	\N	\N	'1.5':4A 'agu':7B 'beb':6B 'bonafont':3A,8C 'famíl':11 'l':5A 'merc':9 'mineral':2A 'águ':1A	json_import	mercado_da_família.json	2025-08-01 16:26:31.557418	active	2025-08-01 16:26:31.557418	2025-08-01 16:26:31.557418	\N	\N
a3234e94-01b7-4fcd-9071-589433fbb019	e2ed6490-e930-44b6-89db-40d2ce1b8ab5	82	Feijão Carioca 1kg	graos	feijao	9.85	Mercado da Família	Rua das Flores, 234	(11) 4622-7777	Kicaldo	7890000000082	1kg	Nacional	85	t	f	0.00	\N	4.60	1876	621	\N	\N	'1kg':3A 'carioc':2A 'famíl':9 'feija':5B 'feijã':1A 'gra':4B 'kicald':6C 'merc':7	json_import	mercado_da_família.json	2025-08-01 16:26:31.557418	active	2025-08-01 16:26:31.557418	2025-08-01 16:26:31.557418	\N	\N
7d340dab-bec6-4325-b2f9-43a721c9727b	e2ed6490-e930-44b6-89db-40d2ce1b8ab5	356	Açúcar Refinado União 1kg	acucar	refinado	4.20	Mercado da Família	Rua das Flores, 234	(11) 4622-7777	União	7890000000356	1kg	Nacional	150	t	f	0.00	\N	4.70	2340	819	\N	\N	'1kg':4A 'acuc':5B 'açúc':1A 'famíl':10 'merc':8 'refin':2A,6B 'uniã':3A,7C	json_import	mercado_da_família.json	2025-08-01 16:26:31.557418	active	2025-08-01 16:26:31.557418	2025-08-01 16:26:31.557418	\N	\N
e5bc4603-22e9-43df-a39c-f0e8a57a1fe0	e2ed6490-e930-44b6-89db-40d2ce1b8ab5	364	Sal Refinado Cisne 1kg	temperos	sal	3.20	Mercado da Família	Rua das Flores, 234	(11) 4622-7777	Cisne	7890000000364	1kg	Nacional	200	t	f	0.00	\N	4.80	1765	617	\N	\N	'1kg':4A 'cisn':3A,7C 'famíl':10 'merc':8 'refin':2A 'sal':1A,6B 'temper':5B	json_import	mercado_da_família.json	2025-08-01 16:26:31.557418	active	2025-08-01 16:26:31.557418	2025-08-01 16:26:31.557418	\N	\N
df27dd82-a7f7-47e6-92de-02c77dc0266b	e2ed6490-e930-44b6-89db-40d2ce1b8ab5	466	Ovos Brancos Grandes Dúzia	pereciveis	ovos	12.50	Mercado da Família	Rua das Flores, 234	(11) 4622-7777	Granja	7890000000411	1 dúzia	Nacional	100	t	f	0.00	\N	4.70	2500	900	\N	\N	'branc':2A 'dúz':4A 'famíl':10 'grand':3A 'granj':7C 'merc':8 'ovos':1A,6B 'pereciv':5B	json_import	mercado_da_família.json	2025-08-01 16:26:31.557418	active	2025-08-01 16:26:31.557418	2025-08-01 16:26:31.557418	\N	\N
341013be-e062-493b-88b3-499f98aa3a62	6762f94f-db65-4ef1-82aa-15a286cbecd5	241	Shampoo Pantene 400ml	higiene	shampoo	22.90	Mercado Popular	Av. das Nações, 890	(11) 4622-4567	Pantene	7890000000241	400ml	Nacional	92	t	t	25.00	\N	4.80	2780	945	\N	\N	'400ml':3A 'higien':4B 'merc':7 'panten':2A,6C 'popul':8 'shampo':1A,5B	json_import	mercado_popular.json	2025-08-01 16:26:31.574551	active	2025-08-01 16:26:31.574551	2025-08-01 16:26:31.574551	\N	\N
683bb169-569d-4202-91b4-b9772d23f4f4	6762f94f-db65-4ef1-82aa-15a286cbecd5	336	Café Pilão 500g	cafe	tradicional	14.90	Mercado Popular	Av. das Nações, 890	(11) 4622-4567	Pilão	7890000000336	500g	Nacional	92	t	t	10.00	\N	4.60	4120	1648	\N	\N	'500g':3A 'caf':1A,4B 'merc':7 'pilã':2A,6C 'popul':8 'tradicional':5B	json_import	mercado_popular.json	2025-08-01 16:26:31.574551	active	2025-08-01 16:26:31.574551	2025-08-01 16:26:31.574551	\N	\N
b0c0a345-d953-4d25-8826-4e142817e7e4	6762f94f-db65-4ef1-82aa-15a286cbecd5	360	Maçã Fuji Kg	frutas	tropicais	7.90	Mercado Popular	Av. das Nações, 890	(11) 4622-4567		7890000000360	1kg	Nacional	40	t	f	0.00	\N	4.80	2450	857	\N	\N	'frut':4B 'fuj':2A 'kg':3A 'maçã':1A 'merc':6 'popul':7 'tropic':5B	json_import	mercado_popular.json	2025-08-01 16:26:31.574551	active	2025-08-01 16:26:31.574551	2025-08-01 16:26:31.574551	\N	\N
4a56cef3-6ccb-4517-9667-f76f28c6ef43	6762f94f-db65-4ef1-82aa-15a286cbecd5	475	Óleo de Girassol Salada 900ml	oleos	girassol	10.50	Mercado Popular	Av. das Nações, 890	(11) 4622-4567	Salada	7890000000420	900ml	Nacional	80	t	t	10.00	\N	4.30	1500	500	\N	\N	'900ml':5A 'girassol':3A,7B 'merc':9 'ole':6B 'popul':10 'sal':4A,8C 'óle':1A	json_import	mercado_popular.json	2025-08-01 16:26:31.574551	active	2025-08-01 16:26:31.574551	2025-08-01 16:26:31.574551	\N	\N
4fb31069-a475-47fd-8327-a5c10dbcdd49	6762f94f-db65-4ef1-82aa-15a286cbecd5	468	Tomate Salada Kg	hortifruti	legumes	6.99	Mercado Popular	Av. das Nações, 890	(11) 4622-4567		7890000000413	1kg	Nacional	50	t	t	10.00	\N	4.60	2200	750	\N	\N	'hortifrut':4B 'kg':3A 'legum':5B 'merc':6 'popul':7 'sal':2A 'tomat':1A	json_import	mercado_popular.json	2025-08-01 16:26:31.574551	active	2025-08-01 16:26:31.574551	2025-08-01 16:26:31.574551	\N	\N
588e0935-d849-41b4-bcd3-a4c9a4959e54	fec62d21-844b-4c71-9300-d1dd2e6041d4	477	Shampoo Seda Ceramidas 325ml	higiene	shampoo	10.90	Mercado Porto	Rua Carlos Magno, 56	(11) 4622-1234	Seda	7890000000477	325ml	Nacional	194	t	f	0.00	\N	4.60	2088	592	\N	\N	'325ml':4A 'ceram':3A 'higien':5B 'merc':8 'port':9 'sed':2A,7C 'shampo':1A,6B	json_import	mercado_porto.json	2025-08-01 16:26:31.60276	active	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276	\N	\N
8d115932-e0c5-47e1-9913-b5dba1cfcf15	fec62d21-844b-4c71-9300-d1dd2e6041d4	487	Desodorante Nivea Men 150ml	higiene	desodorantes	12.75	Mercado Porto	Rua Carlos Magno, 56	(11) 4622-1234	Nivea	7890000000487	150ml	Nacional	58	t	f	0.00	\N	4.40	2633	870	\N	\N	'150ml':4A 'desodor':1A,6B 'higien':5B 'men':3A 'merc':8 'niv':2A,7C 'port':9	json_import	mercado_porto.json	2025-08-01 16:26:31.60276	active	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276	\N	\N
2d54a4ff-1b2d-4ed2-83ba-28988cbe6b14	fec62d21-844b-4c71-9300-d1dd2e6041d4	488	Achocolatado Toddy 400g	bebidas	achocolatados	8.49	Mercado Porto	Rua Carlos Magno, 56	(11) 4622-1234	Toddy	7890000000488	400g	Nacional	128	t	f	0.00	\N	4.50	2598	1164	\N	\N	'400g':3A 'achocolat':1A,5B 'beb':4B 'merc':7 'port':8 'toddy':2A,6C	json_import	mercado_porto.json	2025-08-01 16:26:31.60276	active	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276	\N	\N
0de179ea-8de0-4c25-a515-ee862b66bd2e	fec62d21-844b-4c71-9300-d1dd2e6041d4	489	Gelatina Royal Morango 35g	doces	gelatina	1.89	Mercado Porto	Rua Carlos Magno, 56	(11) 4622-1234	Royal	7890000000489	35g	Nacional	158	t	f	0.00	\N	4.60	1960	663	\N	\N	'35g':4A 'doc':5B 'gelatin':1A,6B 'merc':8 'morang':3A 'port':9 'royal':2A,7C	json_import	mercado_porto.json	2025-08-01 16:26:31.60276	active	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276	\N	\N
33e48ab7-a1e6-423e-ba6c-540192fcae1f	fec62d21-844b-4c71-9300-d1dd2e6041d4	491	Queijo Prato Fatiado 200g	frios	queijo	10.90	Mercado Porto	Rua Carlos Magno, 56	(11) 4622-1234	Sadia	7890000000491	200g	Nacional	82	t	f	0.00	\N	4.20	1862	221	\N	\N	'200g':4A 'fati':3A 'fri':5B 'merc':8 'port':9 'prat':2A 'queij':1A,6B 'sad':7C	json_import	mercado_porto.json	2025-08-01 16:26:31.60276	active	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276	\N	\N
52123626-15a0-49a6-a360-3326bb2d74e5	fec62d21-844b-4c71-9300-d1dd2e6041d4	492	Hambúrguer Bovino Sadia 672g	congelados	hamburguer	17.99	Mercado Porto	Rua Carlos Magno, 56	(11) 4622-1234	Sadia	7890000000492	672g	Nacional	145	t	f	0.00	\N	4.60	2223	737	\N	\N	'672g':4A 'bovin':2A 'congel':5B 'hamburgu':6B 'hambúrgu':1A 'merc':8 'port':9 'sad':3A,7C	json_import	mercado_porto.json	2025-08-01 16:26:31.60276	active	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276	\N	\N
4568ffda-ec30-47b7-a3a9-cf1d708ef4b5	fec62d21-844b-4c71-9300-d1dd2e6041d4	493	Esponja de Aço Assolan 8un	limpeza	esponjas	3.60	Mercado Porto	Rua Carlos Magno, 56	(11) 4622-1234	Assolan	7890000000493	8un	Nacional	56	t	f	0.00	\N	4.30	2220	561	\N	\N	'8un':5A 'assolan':4A,8C 'aço':3A 'esponj':1A,7B 'limpez':6B 'merc':9 'port':10	json_import	mercado_porto.json	2025-08-01 16:26:31.60276	active	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276	\N	\N
66b49952-a604-46d4-9114-0f5078a1fbf3	fec62d21-844b-4c71-9300-d1dd2e6041d4	495	Creme de Leite Nestlé 200g	laticinios	creme_leite	4.49	Mercado Porto	Rua Carlos Magno, 56	(11) 4622-1234	Nestlé	7890000000495	200g	Nacional	157	t	f	0.00	\N	4.70	2153	1145	\N	\N	'200g':5A 'crem':1A,7B 'laticini':6B 'leit':3A,8B 'merc':10 'nestl':4A,9C 'port':11	json_import	mercado_porto.json	2025-08-01 16:26:31.60276	active	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276	\N	\N
87a2b66d-cded-44e2-9a23-5419fcc1e3ea	fec62d21-844b-4c71-9300-d1dd2e6041d4	496	Molho Shoyu Sakura 150ml	condimentos	shoyu	3.75	Mercado Porto	Rua Carlos Magno, 56	(11) 4622-1234	Sakura	7890000000496	150ml	Nacional	126	t	f	20.00	\N	4.30	2358	1176	\N	\N	'150ml':4A 'condiment':5B 'merc':8 'molh':1A 'port':9 'sakur':3A,7C 'shoyu':2A,6B	json_import	mercado_porto.json	2025-08-01 16:26:31.60276	active	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276	\N	\N
9f758a85-8f79-4b5a-8240-1161d217568a	fec62d21-844b-4c71-9300-d1dd2e6041d4	499	Sabonete Lux Suave 85g	higiene	sabonetes	2.25	Mercado Porto	Rua Carlos Magno, 56	(11) 4622-1234	Lux	7890000000499	85g	Nacional	129	t	f	10.00	\N	4.80	2141	258	\N	\N	'85g':4A 'higien':5B 'lux':2A,7C 'merc':8 'port':9 'sabonet':1A,6B 'suav':3A	json_import	mercado_porto.json	2025-08-01 16:26:31.60276	active	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276	\N	\N
50efa7bd-512a-400f-aa5b-61ff606f1329	fec62d21-844b-4c71-9300-d1dd2e6041d4	501	Farinha de Mandioca Yoki 500g	graos	farinhas	4.49	Mercado Porto	Rua Carlos Magno, 56	(11) 4622-1234	Yoki	7890000000501	500g	Nacional	77	t	t	0.00	\N	4.30	2900	757	\N	\N	'500g':5A 'farinh':1A,7B 'gra':6B 'mandioc':3A 'merc':9 'port':10 'yok':4A,8C	json_import	mercado_porto.json	2025-08-01 16:26:31.60276	active	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276	\N	\N
7ee55288-420e-461e-9a31-c47c2ea7d91b	fec62d21-844b-4c71-9300-d1dd2e6041d4	513	Suco de Uva Integral Aurora 1L	bebidas	sucos	12.99	Mercado Porto	Rua Carlos Magno, 56	(11) 4622-1234	Aurora	7890000000513	1L	Nacional	79	t	t	0.00	\N	4.50	2486	1236	\N	\N	'1l':6A 'auror':5A,9C 'beb':7B 'integral':4A 'merc':10 'port':11 'suc':1A,8B 'uva':3A	json_import	mercado_porto.json	2025-08-01 16:26:31.60276	active	2025-08-01 16:26:31.60276	2025-08-01 16:26:31.60276	\N	\N
df718d8a-7b92-4b1d-892d-bd6a5923bc9a	48147fef-9418-4485-9658-a3538e3011d5	1	Coca Cola 350ml	bebidas	refrigerantes	4.99	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Coca-Cola	7894900010001	350ml	Nacional	145	t	f	0.00	\N	4.50	2847	982	\N	\N	'350ml':3A 'beb':4B 'coc':1A,7C 'coca-col':6C 'col':2A,8C 'joã':11 'merc':9 'refriger':5B	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
25abd1d6-ce5b-464f-b7a4-b9c8282af8e5	48147fef-9418-4485-9658-a3538e3011d5	242	Creme Dental Colgate 90g	higiene	pasta_dente	5.50	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Colgate	7890000000242	90g	Nacional	210	t	f	0.00	\N	4.90	3650	1533	\N	\N	'90g':4A 'colgat':3A,8C 'crem':1A 'dent':7B 'dental':2A 'higien':5B 'joã':11 'merc':9 'past':6B	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
5d3cfa97-8a4e-43b7-b024-a2d6aaf18625	48147fef-9418-4485-9658-a3538e3011d5	337	Café Orfeu Gourmet 250g	cafe	gourmet	28.50	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Orfeu	7890000000337	250g	Nacional	37	t	f	0.00	\N	4.90	956	287	\N	\N	'250g':4A 'caf':1A,5B 'gourmet':3A,6B 'joã':10 'merc':8 'orfeu':2A,7C	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
cf0a69a0-ff0b-41df-ab0b-21947ac59884	48147fef-9418-4485-9658-a3538e3011d5	361	Alface Crespa Unidade	verduras	folhas	2.50	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234		7890000000361	un	Local	35	t	t	20.00	\N	4.70	1870	654	\N	\N	'alfac':1A 'cresp':2A 'folh':5B 'joã':8 'merc':6 'unidad':3A 'verdur':4B	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
fe098bca-4dd9-4ba4-a2a6-2e76b0f0a242	48147fef-9418-4485-9658-a3538e3011d5	414	Cerveja Brahma Lata 350ml	bebidas	cervejas	2.99	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Brahma	7890000000414	350ml	Nacional	140	t	f	0.00	\N	4.50	1275	487	\N	\N	'350ml':4A 'beb':5B 'brahm':2A,7C 'cervej':1A,6B 'joã':10 'lat':3A 'merc':8	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
7a992609-943c-4be2-b58a-ed658e2da5c1	48147fef-9418-4485-9658-a3538e3011d5	416	Margarina Qualy 500g	laticinios	margarina	8.49	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Qualy	7890000000416	500g	Nacional	86	t	f	0.00	\N	4.30	2221	425	\N	\N	'500g':3A 'joã':9 'laticini':4B 'margarin':1A,5B 'merc':7 'qualy':2A,6C	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
41c2a3c5-674c-40ef-bfc1-3f00fec5d080	48147fef-9418-4485-9658-a3538e3011d5	417	Papel Higiênico Neve 12un	higiene	papel_higienico	23.90	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Neve	7890000000417	12un	Nacional	82	t	t	10.00	\N	4.40	945	669	\N	\N	'12un':4A 'higien':5B,7B 'higiên':2A 'joã':11 'merc':9 'nev':3A,8C 'papel':1A,6B	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
c009274b-53cc-47ed-999f-e5b755b3c05b	48147fef-9418-4485-9658-a3538e3011d5	418	Desinfetante Veja Multiuso 500ml	limpeza	desinfetantes	6.75	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Veja	7890000000418	500ml	Nacional	144	t	f	0.00	\N	4.40	1503	1141	\N	\N	'500ml':4A 'desinfet':1A,6B 'joã':10 'limpez':5B 'merc':8 'multius':3A 'vej':2A,7C	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
7831bed4-bbba-4c5d-9b1b-9032e46f35fc	48147fef-9418-4485-9658-a3538e3011d5	419	Farinha de Trigo Dona Benta 1kg	graos	farinha_trigo	5.40	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Dona Benta	7890000000419	1kg	Nacional	132	t	f	0.00	\N	4.70	2818	657	\N	\N	'1kg':6A 'bent':5A,11C 'don':4A,10C 'farinh':1A,8B 'gra':7B 'joã':14 'merc':12 'trig':3A,9B	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
7a6024c0-8aad-49d3-8dbb-ed32a45eb7bb	48147fef-9418-4485-9658-a3538e3011d5	420	Banana Nanica Kg	frutas	tropicais	4.25	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234		7890000000420	1kg	Nacional	109	t	f	0.00	\N	4.30	1216	749	\N	\N	'banan':1A 'frut':4B 'joã':8 'kg':3A 'merc':6 'nanic':2A 'tropic':5B	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
ed17bb48-d914-497d-aaad-38e0147c88e2	48147fef-9418-4485-9658-a3538e3011d5	421	Iogurte Nestlé Morango 170g	laticinios	iogurtes	2.99	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Nestlé	7890000000421	170g	Nacional	182	t	t	5.00	\N	4.70	2190	367	\N	\N	'170g':4A 'iogurt':1A,6B 'joã':10 'laticini':5B 'merc':8 'morang':3A 'nestl':2A,7C	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
4c5f11e1-8a0c-46c0-9975-caa2402b883b	48147fef-9418-4485-9658-a3538e3011d5	422	Desodorante Rexona Aerosol 150ml	higiene	desodorantes	13.50	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Rexona	7890000000422	150ml	Nacional	115	t	f	0.00	\N	4.80	1488	945	\N	\N	'150ml':4A 'aerosol':3A 'desodor':1A,6B 'higien':5B 'joã':10 'merc':8 'rexon':2A,7C	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
86f97b81-1679-4a1f-a000-18ae58f91543	48147fef-9418-4485-9658-a3538e3011d5	423	Arroz Parboilizado Camil 5kg	graos	arroz	27.90	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Camil	7890000000423	5kg	Nacional	98	t	f	0.00	\N	4.50	1484	367	\N	\N	'5kg':4A 'arroz':1A,6B 'camil':3A,7C 'gra':5B 'joã':10 'merc':8 'parboiliz':2A	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
0b85ac45-8078-4998-8c06-ab844bf8260b	48147fef-9418-4485-9658-a3538e3011d5	424	Molho de Tomate Pomarola Tradicional 340g	enlatados	molho_tomate	3.10	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Pomarola	7890000000424	340g	Nacional	34	t	f	0.00	\N	4.30	1537	358	\N	\N	'340g':6A 'enlat':7B 'joã':13 'merc':11 'molh':1A,8B 'pomarol':4A,10C 'tomat':3A,9B 'tradicional':5A	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
d894ffb1-a10f-4853-aef9-18ed87462638	48147fef-9418-4485-9658-a3538e3011d5	425	Biscoito Cream Cracker Marilan 200g	biscoitos	salgado	3.80	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Marilan	7890000000425	200g	Nacional	176	t	f	0.00	\N	4.70	2196	388	\N	\N	'200g':5A 'biscoit':1A,6B 'crack':3A 'cre':2A 'joã':11 'marilan':4A,8C 'merc':9 'salg':7B	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
95ce45b6-e365-48bb-927a-5409e411977c	48147fef-9418-4485-9658-a3538e3011d5	469	Cebola Kg	hortifruti	legumes	4.50	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234		7890000000414	1kg	Nacional	70	t	f	0.00	\N	4.50	1900	600	\N	\N	'cebol':1A 'hortifrut':3B 'joã':7 'kg':2A 'legum':4B 'merc':5	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
b5ea8bfa-9881-4d5e-94f8-ab3a4cc93612	48147fef-9418-4485-9658-a3538e3011d5	476	Refrigerante Pepsi 2L	bebidas	refrigerantes	7.49	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Pepsi	7890000000476	2L	Nacional	147	t	f	0.00	\N	4.70	2673	736	\N	\N	'2l':3A 'beb':4B 'joã':9 'merc':7 'peps':2A,6C 'refriger':1A,5B	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
0547795c-b313-47b1-9ef5-244f9c7a8319	48147fef-9418-4485-9658-a3538e3011d5	478	Sabão em Barra Ypê 5un	limpeza	sabao_barra	6.80	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Ypê	7890000000478	5un	Nacional	156	t	f	0.00	\N	4.80	807	1232	\N	\N	'5un':5A 'barr':3A,8B 'joã':12 'limpez':6B 'merc':10 'saba':7B 'sabã':1A 'ypê':4A,9C	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
f3c21364-0c45-4330-adcf-8563c96b578e	48147fef-9418-4485-9658-a3538e3011d5	480	Leite Condensado Moça 395g	laticinios	condensado	7.99	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Nestlé	7890000000480	395g	Nacional	46	t	f	0.00	\N	4.30	2724	1248	\N	\N	'395g':4A 'condens':2A,6B 'joã':10 'laticini':5B 'leit':1A 'merc':8 'moc':3A 'nestl':7C	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
4a757c49-6b16-43d9-87a3-5196dedfc819	48147fef-9418-4485-9658-a3538e3011d5	490	Presunto Seara Fatiado 200g	frios	presunto	7.29	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Seara	7890000000490	200g	Nacional	72	t	f	0.00	\N	4.70	2977	540	\N	\N	'200g':4A 'fati':3A 'fri':5B 'joã':10 'merc':8 'presunt':1A,6B 'sear':2A,7C	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
0a3907c6-fc3a-4907-aa23-4ab1d9e69872	48147fef-9418-4485-9658-a3538e3011d5	494	Pipoca para Micro-ondas Yoki 100g	salgadinhos	pipoca	2.89	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Yoki	7890000000494	100g	Nacional	104	t	f	0.00	\N	4.80	2455	843	\N	\N	'100g':7A 'joã':13 'merc':11 'micr':4A 'micro-ond':3A 'ondas':5A 'pipoc':1A,9B 'salgadinh':8B 'yok':6A,10C	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
6073bc3e-477e-46a7-aa6c-1ec2aa60cfba	48147fef-9418-4485-9658-a3538e3011d5	497	Ervilha em Conserva Quero 200g	enlatados	ervilhas	2.89	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Quero	7890000000497	200g	Nacional	163	t	f	10.00	\N	4.90	989	753	\N	\N	'200g':5A 'conserv':3A 'enlat':6B 'ervilh':1A,7B 'joã':11 'merc':9 'quer':4A,8C	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
39d22694-cfd6-4a21-a8d7-b4ff1cb3bd48	48147fef-9418-4485-9658-a3538e3011d5	502	Macarrão Nissin Miojo Galinha 85g	massas	instantaneo	1.89	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Nissin	7890000000502	85g	Nacional	181	t	t	20.00	\N	4.80	1287	108	\N	\N	'85g':5A 'galinh':4A 'instantan':7B 'joã':11 'macarrã':1A 'mass':6B 'merc':9 'mioj':3A 'nissin':2A,8C	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
9a246182-ae74-488b-9c4c-5836a281ed37	48147fef-9418-4485-9658-a3538e3011d5	505	Cerveja Itaipava Lata 350ml	bebidas	cervejas	2.89	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Itaipava	7890000000505	350ml	Nacional	65	t	f	15.00	\N	4.70	845	917	\N	\N	'350ml':4A 'beb':5B 'cervej':1A,6B 'itaip':2A,7C 'joã':10 'lat':3A 'merc':8	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
12a554fd-38ac-4b0d-a077-056b35861a52	48147fef-9418-4485-9658-a3538e3011d5	506	Água Sanitária Qboa 1L	limpeza	agua_sanitaria	3.99	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Qboa	7890000000506	1L	Nacional	174	t	t	15.00	\N	4.60	1422	1436	\N	\N	'1l':4A 'agu':6B 'joã':11 'limpez':5B 'merc':9 'qbo':3A,8C 'sanit':7B 'sanitár':2A 'águ':1A	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
70aee096-b688-40e4-966c-4c09bb14ccb3	48147fef-9418-4485-9658-a3538e3011d5	507	Bolacha Maizena Marilan 400g	biscoitos	maizena	5.59	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Marilan	7890000000507	400g	Nacional	42	t	f	20.00	\N	4.50	565	432	\N	\N	'400g':4A 'biscoit':5B 'bolach':1A 'joã':10 'maizen':2A,6B 'marilan':3A,7C 'merc':8	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
47c1f55e-2fa1-4413-8de7-6d1adb1f324e	48147fef-9418-4485-9658-a3538e3011d5	508	Polpa de Tomate Elefante 340g	enlatados	molho_tomate	4.19	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Elefante	7890000000508	340g	Nacional	195	t	f	20.00	\N	4.60	1727	1183	\N	\N	'340g':5A 'elef':4A,9C 'enlat':6B 'joã':12 'merc':10 'molh':7B 'polp':1A 'tomat':3A,8B	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
71f038ad-c813-4b4c-b459-1b6d56d26ff4	48147fef-9418-4485-9658-a3538e3011d5	509	Água com Gás Crystal 500ml	bebidas	aguas	2.45	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Crystal	7890000000509	500ml	Nacional	147	t	t	20.00	\N	4.60	972	528	\N	\N	'500ml':5A 'agu':7B 'beb':6B 'crystal':4A,8C 'gás':3A 'joã':11 'merc':9 'águ':1A	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
abf5a1ce-57da-4693-a248-5c59850511ce	48147fef-9418-4485-9658-a3538e3011d5	511	Lentilha Camil 500g	graos	leguminosas	7.25	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Camil	7890000000511	500g	Nacional	44	t	t	10.00	\N	4.70	1587	1148	\N	\N	'500g':3A 'camil':2A,6C 'gra':4B 'joã':9 'legumin':5B 'lentilh':1A 'merc':7	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
999f296f-e951-4b9d-9f0f-18b4e167e439	48147fef-9418-4485-9658-a3538e3011d5	512	Chiclete Trident Menta 14g	doces	balas	2.75	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Trident	7890000000512	14g	Nacional	31	t	t	0.00	\N	4.60	3046	1008	\N	\N	'14g':4A 'bal':6B 'chiclet':1A 'doc':5B 'joã':10 'ment':3A 'merc':8 'trident':2A,7C	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
01fbf300-df85-41ae-a389-08a13f2a47cb	48147fef-9418-4485-9658-a3538e3011d5	514	Iogurte Grego Vigor 100g	laticinios	iogurtes	3.89	Mercado São João	Rua Nove de Julho, 123	(11) 4622-1234	Vigor	7890000000514	100g	Nacional	137	t	f	15.00	\N	4.10	3475	908	\N	\N	'100g':4A 'greg':2A 'iogurt':1A,6B 'joã':10 'laticini':5B 'merc':8 'vigor':3A,7C	json_import	mercado_sao_joao.json	2025-08-01 16:26:31.630884	active	2025-08-01 16:26:31.630884	2025-08-01 16:26:31.630884	\N	\N
03b46e00-ba93-4aca-911e-f095960f288c	bb9c6b33-adda-4e41-8ecd-99e8090d03cc	467	Pão Francês Unidade	panificacao	paes_frescos	0.80	Padaria Central	Rua do Comércio, 10	(11) 4622-1111		7890000000412	un	Local	300	t	f	0.00	\N	4.90	3000	1200	\N	\N	'central':8 'francês':2A 'fresc':6B 'pad':7 'paes':5B 'panificaca':4B 'pã':1A 'unidad':3A	json_import	padaria_central.json	2025-08-01 16:26:31.686261	active	2025-08-01 16:26:31.686261	2025-08-01 16:26:31.686261	\N	\N
de550f8e-ae89-466a-9696-ab13d2f852cb	441437a5-5656-4489-8771-8340dc53cb6e	1001	Arroz Tipo 1 Camil 5kg	grãos	arroz	22.49	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Camil	7890000010011	5kg	Nacional	120	t	f	0.00	\N	4.60	2145	841	\N	\N	'1':3A '5kg':5A 'arroz':1A,7B 'camil':4A,8C 'fé':10 'grã':6B 'paulist':12 'pq':11 'sant':9 'tip':2A	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
6f25ed5a-7f1c-484f-8373-b687f270e9d0	441437a5-5656-4489-8771-8340dc53cb6e	1002	Feijão Carioca Kicaldo 1kg	grãos	feijao	8.99	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Kicaldo	7890000010028	1kg	Nacional	95	t	f	0.00	\N	4.50	1842	732	\N	\N	'1kg':4A 'carioc':2A 'feija':6B 'feijã':1A 'fé':9 'grã':5B 'kicald':3A,7C 'paulist':11 'pq':10 'sant':8	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
783f3aef-9702-4c56-b5ae-b890328c43b9	441437a5-5656-4489-8771-8340dc53cb6e	1003	Óleo de Soja Soya 900ml	óleos	soja	6.89	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Soya	7890000010035	900ml	Nacional	200	t	t	10.00	\N	4.70	1983	810	\N	\N	'900ml':5A 'fé':10 'paulist':12 'pq':11 'sant':9 'soj':3A,7B 'soy':4A,8C 'óle':1A,6B	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
c5800501-b7fd-43b0-b409-0e77ab743a62	441437a5-5656-4489-8771-8340dc53cb6e	1004	Leite Integral Italac 1L	laticínios	leite	4.99	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Italac	7890000010042	1L	Nacional	210	t	f	0.00	\N	4.80	2561	934	\N	\N	'1l':4A 'fé':9 'integral':2A 'italac':3A,7C 'laticíni':5B 'leit':1A,6B 'paulist':11 'pq':10 'sant':8	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
5130fc88-9f48-436b-88fc-180552a574fa	441437a5-5656-4489-8771-8340dc53cb6e	1005	Detergente Ypê Neutro 500ml	limpeza	detergente	2.29	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Ypê	7890000010059	500ml	Nacional	320	t	f	0.00	\N	4.60	1122	433	\N	\N	'500ml':4A 'detergent':1A,6B 'fé':9 'limpez':5B 'neutr':3A 'paulist':11 'pq':10 'sant':8 'ypê':2A,7C	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
610baf4a-934b-47cc-bb5f-ed1771318a0e	441437a5-5656-4489-8771-8340dc53cb6e	1006	Cerveja Skol Lata 350ml	bebidas	cerveja	2.79	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Skol	7890000010066	350ml	Nacional	300	t	t	5.00	\N	4.20	3100	1030	\N	\N	'350ml':4A 'beb':5B 'cervej':1A,6B 'fé':9 'lat':3A 'paulist':11 'pq':10 'sant':8 'skol':2A,7C	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
e06c8bdf-7643-4c29-a049-05c5970e4f0a	441437a5-5656-4489-8771-8340dc53cb6e	1007	Refrigerante Coca-Cola 2L	bebidas	refrigerante	8.49	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Coca-Cola	7890000010073	2L	Nacional	280	t	f	0.00	\N	4.90	4120	1802	\N	\N	'2l':5A 'beb':6B 'coc':3A,9C 'coca-col':2A,8C 'col':4A,10C 'fé':12 'paulist':14 'pq':13 'refriger':1A,7B 'sant':11	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
71522b13-c6fc-4d74-ad3b-77f49b05e125	441437a5-5656-4489-8771-8340dc53cb6e	1008	Frango Resfriado Inteiro 1kg	carnes	aves	9.49	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Perdigão	7890000010080	1kg	Nacional	130	t	f	0.00	\N	4.30	1320	510	\N	\N	'1kg':4A 'aves':6B 'carn':5B 'frang':1A 'fé':9 'inteir':3A 'paulist':11 'perdigã':7C 'pq':10 'resfri':2A 'sant':8	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
3c83de64-094d-429a-a817-accf9685d78f	441437a5-5656-4489-8771-8340dc53cb6e	1009	Farinha de Trigo Dona Benta 1kg	panificação	farinha	4.29	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Dona Benta	7890000010097	1kg	Nacional	180	t	f	0.00	\N	4.50	985	404	\N	\N	'1kg':6A 'bent':5A,10C 'don':4A,9C 'farinh':1A,8B 'fé':12 'panific':7B 'paulist':14 'pq':13 'sant':11 'trig':3A	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
f7e405bf-6b00-4701-a9f9-d02239bef639	441437a5-5656-4489-8771-8340dc53cb6e	1010	Café Pilão Tradicional 500g	bebidas	café	13.49	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Pilão	7890000010103	500g	Nacional	160	t	f	0.00	\N	4.70	1542	620	\N	\N	'500g':4A 'beb':5B 'caf':1A,6B 'fé':9 'paulist':11 'pilã':2A,7C 'pq':10 'sant':8 'tradicional':3A	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
d9acb925-96d6-4584-87b3-ced9ec27e6e2	441437a5-5656-4489-8771-8340dc53cb6e	1011	Creme Dental Colgate 90g	higiene	creme_dental	3.99	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Colgate	789000001011	90g	Nacional	101	t	t	15.00	\N	4.30	1362	691	\N	\N	'90g':4A 'colgat':3A,8C 'crem':1A,6B 'dental':2A,7B 'fé':10 'higien':5B 'paulist':12 'pq':11 'sant':9	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
b7fb23e9-566c-4cc7-ac3e-b73d3a2c4d21	441437a5-5656-4489-8771-8340dc53cb6e	1012	Sabonete Lux Botanicals 85g	higiene	sabonete	2.49	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Lux	789000001012	85g	Nacional	234	t	f	0.00	\N	4.60	1583	810	\N	\N	'85g':4A 'botanicals':3A 'fé':9 'higien':5B 'lux':2A,7C 'paulist':11 'pq':10 'sabonet':1A,6B 'sant':8	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
11da51ea-012f-40aa-b09e-66826f2b576a	441437a5-5656-4489-8771-8340dc53cb6e	1013	Papel Higiênico Neve 12x30m	higiene	papel_higienico	17.99	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Neve	789000001013	12x30m	Nacional	290	t	t	0.00	\N	4.60	2924	567	\N	\N	'12x30m':4A 'fé':10 'higien':5B,7B 'higiên':2A 'nev':3A,8C 'papel':1A,6B 'paulist':12 'pq':11 'sant':9	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
4734932c-9fd4-4cef-a387-2b334ec3df47	441437a5-5656-4489-8771-8340dc53cb6e	1014	Sabão Líquido OMO Lavagem Perfeita 3L	limpeza	sabao_liquido	32.90	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	OMO	789000001014	3L	Nacional	229	t	t	0.00	\N	4.60	1643	627	\N	\N	'3l':6A 'fé':12 'lavag':4A 'limpez':7B 'liqu':9B 'líqu':2A 'omo':3A,10C 'paulist':14 'perfeit':5A 'pq':13 'saba':8B 'sabã':1A 'sant':11	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
7f624bd9-b55c-4092-9549-aac5cb1f4422	441437a5-5656-4489-8771-8340dc53cb6e	1015	Desinfetante Pinho Sol 500ml	limpeza	desinfetante	4.99	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Pinho Sol	789000001015	500ml	Nacional	240	t	f	0.00	\N	4.60	3159	393	\N	\N	'500ml':4A 'desinfet':1A,6B 'fé':10 'limpez':5B 'paulist':12 'pinh':2A,7C 'pq':11 'sant':9 'sol':3A,8C	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
26dcbb72-488f-45a3-a675-204c0820c52b	441437a5-5656-4489-8771-8340dc53cb6e	1016	Achocolatado Nescau 2.0 400g	bebidas	achocolatado	7.29	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Nescau	789000001016	400g	Nacional	247	t	f	20.00	\N	4.70	2518	689	\N	\N	'2.0':3A '400g':4A 'achocolat':1A,6B 'beb':5B 'fé':9 'nescau':2A,7C 'paulist':11 'pq':10 'sant':8	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
226e03c6-1e6e-498c-967c-6aa54a309e4d	441437a5-5656-4489-8771-8340dc53cb6e	1017	Queijo Mussarela Fatiado 500g	laticínios	queijo	22.50	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Tirol	789000001017	500g	Nacional	204	t	t	25.00	\N	4.50	2783	433	\N	\N	'500g':4A 'fati':3A 'fé':9 'laticíni':5B 'mussarel':2A 'paulist':11 'pq':10 'queij':1A,6B 'sant':8 'tirol':7C	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
04a1caed-8ca4-41e3-9c42-519a3a4d3e0f	441437a5-5656-4489-8771-8340dc53cb6e	1018	Presunto Sadia Fatiado 200g	frios	presunto	6.99	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Sadia	789000001018	200g	Nacional	52	t	f	0.00	\N	4.60	2066	929	\N	\N	'200g':4A 'fati':3A 'fri':5B 'fé':9 'paulist':11 'pq':10 'presunt':1A,6B 'sad':2A,7C 'sant':8	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
0d1703d4-38d1-4129-9db3-0e523081e2e7	441437a5-5656-4489-8771-8340dc53cb6e	1019	Iogurte Nestlé Morango 540g	laticínios	iogurte	8.49	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Nestlé	789000001019	540g	Nacional	233	t	t	0.00	\N	4.60	1893	687	\N	\N	'540g':4A 'fé':9 'iogurt':1A,6B 'laticíni':5B 'morang':3A 'nestl':2A,7C 'paulist':11 'pq':10 'sant':8	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
026e8759-417a-46a1-8d70-0b873e01863c	441437a5-5656-4489-8771-8340dc53cb6e	1020	Margarina Qualy 500g	laticínios	margarina	6.75	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Qualy	789000001020	500g	Nacional	95	t	f	0.00	\N	4.20	3438	870	\N	\N	'500g':3A 'fé':8 'laticíni':4B 'margarin':1A,5B 'paulist':10 'pq':9 'qualy':2A,6C 'sant':7	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
e88809b7-a8de-4062-9cff-e85de47400a7	441437a5-5656-4489-8771-8340dc53cb6e	1021	Bolacha Recheada Bono Chocolate 140g	biscoitos	doce	2.99	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Bono	789000001021	140g	Nacional	282	t	f	0.00	\N	4.70	2326	866	\N	\N	'140g':5A 'biscoit':6B 'bolach':1A 'bon':3A,8C 'chocolat':4A 'doc':7B 'fé':10 'paulist':12 'pq':11 'rech':2A 'sant':9	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
e61323ea-d857-400b-94e6-02f5fd7ba505	441437a5-5656-4489-8771-8340dc53cb6e	1022	Salsicha Hot Dog Perdigão 500g	frios	salsicha	5.90	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Perdigão	789000001022	500g	Nacional	179	t	f	20.00	\N	4.70	2570	643	\N	\N	'500g':5A 'dog':3A 'fri':6B 'fé':10 'hot':2A 'paulist':12 'perdigã':4A,8C 'pq':11 'salsich':1A,7B 'sant':9	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
0e41afca-f154-47d9-aa36-b5c8d3daf8c7	441437a5-5656-4489-8771-8340dc53cb6e	1023	Água Sanitária Qboa 1L	limpeza	agua_sanitaria	3.39	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Qboa	789000001023	1L	Nacional	164	t	f	0.00	\N	4.30	1021	1129	\N	\N	'1l':4A 'agu':6B 'fé':10 'limpez':5B 'paulist':12 'pq':11 'qbo':3A,8C 'sanit':7B 'sanitár':2A 'sant':9 'águ':1A	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
14ef400c-55e9-4670-b4f4-cf913c6c9ff6	441437a5-5656-4489-8771-8340dc53cb6e	1024	Batata Congelada McCain 2kg	congelados	batata	25.90	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	McCain	789000001024	2kg	Nacional	292	t	t	0.00	\N	4.70	2008	983	\N	\N	'2kg':4A 'batat':1A,6B 'congel':2A,5B 'fé':9 'mccain':3A,7C 'paulist':11 'pq':10 'sant':8	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
82232d10-d60c-4d72-8a25-52217e309a28	441437a5-5656-4489-8771-8340dc53cb6e	1025	Suco de Laranja Natural One 1,5L	bebidas	suco	11.90	Santa Fé - Pq Paulista	Av. Brasil, 1540	(11) 4657-2341	Natural One	789000001025	1,5L	Nacional	68	t	t	15.00	\N	4.80	2897	449	\N	\N	'1':6A '5l':7A 'beb':8B 'fé':13 'laranj':3A 'natural':4A,10C 'one':5A,11C 'paulist':15 'pq':14 'sant':12 'suc':1A,9B	json_import	santa_fe_pq_paulista.json	2025-08-01 16:26:31.697617	active	2025-08-01 16:26:31.697617	2025-08-01 16:26:31.697617	\N	\N
4f9e33ab-b162-4104-9e27-9e08bfcc653c	29520ebc-4471-4270-9257-384562aefdce	191	Leite UHT Integral 1L	laticinios	leite	5.20	Supermercado Vila Nova	Rua das Acácias, 567	(11) 4622-7890	Parmalat	7890000000191	1L	Nacional	150	t	f	0.00	\N	4.60	4120	1854	\N	\N	'1l':4A 'integral':3A 'laticini':5B 'leit':1A,6B 'nov':10 'parmalat':7C 'supermerc':8 'uht':2A 'vil':9	json_import	supermercado_vila_nova.json	2025-08-01 16:26:31.763441	active	2025-08-01 16:26:31.763441	2025-08-01 16:26:31.763441	\N	\N
02a506e4-ca5c-4fc9-9d82-1208f980b48c	29520ebc-4471-4270-9257-384562aefdce	281	Peito de Frango Congelado 1kg	carnes	frango	16.90	Supermercado Vila Nova	Rua das Acácias, 567	(11) 4622-7890	Sadia	7890000000281	1kg	Nacional	45	t	t	15.00	\N	4.30	3210	1284	\N	\N	'1kg':5A 'carn':6B 'congel':4A 'frang':3A,7B 'nov':11 'peit':1A 'sad':8C 'supermerc':9 'vil':10	json_import	supermercado_vila_nova.json	2025-08-01 16:26:31.763441	active	2025-08-01 16:26:31.763441	2025-08-01 16:26:31.763441	\N	\N
23f94f8a-7943-42c0-935c-532925a64c06	29520ebc-4471-4270-9257-384562aefdce	358	Biscoito Recheado Trakinas 130g	biscoitos	recheado	3.99	Supermercado Vila Nova	Rua das Acácias, 567	(11) 4622-7890	Trakinas	7890000000358	130g	Nacional	95	t	f	0.00	\N	4.30	1890	662	\N	\N	'130g':4A 'biscoit':1A,5B 'nov':10 'rech':2A,6B 'supermerc':8 'trakin':3A,7C 'vil':9	json_import	supermercado_vila_nova.json	2025-08-01 16:26:31.763441	active	2025-08-01 16:26:31.763441	2025-08-01 16:26:31.763441	\N	\N
9b0b6721-848b-4494-bb5c-163e1be68df0	29520ebc-4471-4270-9257-384562aefdce	366	Cereal Nesfit 300g	cereais	flocos	14.20	Supermercado Vila Nova	Rua das Acácias, 567	(11) 4622-7890	Nesfit	7890000000366	300g	Nacional	65	t	f	0.00	\N	4.40	1321	462	\N	\N	'300g':3A 'cer':4B 'cereal':1A 'floc':5B 'nesfit':2A,6C 'nov':9 'supermerc':7 'vil':8	json_import	supermercado_vila_nova.json	2025-08-01 16:26:31.763441	active	2025-08-01 16:26:31.763441	2025-08-01 16:26:31.763441	\N	\N
f9cc5258-5222-4c7e-976d-ae4c4c8be298	29520ebc-4471-4270-9257-384562aefdce	473	Refrigerante Guaraná Antarctica 2L	bebidas	refrigerantes	7.80	Supermercado Vila Nova	Rua das Acácias, 567	(11) 4622-7890	Guaraná Antarctica	7890000000418	2L	Nacional	90	t	t	8.00	\N	4.60	2300	800	\N	\N	'2l':4A 'antarct':3A,8C 'beb':5B 'guaran':2A,7C 'nov':11 'refriger':1A,6B 'supermerc':9 'vil':10	json_import	supermercado_vila_nova.json	2025-08-01 16:26:31.763441	active	2025-08-01 16:26:31.763441	2025-08-01 16:26:31.763441	\N	\N
\.


--
-- Data for Name: subscription_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscription_history (id, subscription_id, event_type, description, amount, currency, payment_method, payment_status, payment_gateway_transaction_id, plan_snapshot, created_at, created_by) FROM stdin;
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, market_id, plan, status, billing_cycle, monthly_price, yearly_price, currency, start_date, end_date, next_billing_date, last_payment_date, payment_method, payment_gateway, payment_gateway_customer_id, payment_gateway_subscription_id, auto_renew, grace_period_days, features, max_products, max_users, max_api_calls, max_storage_mb, is_trial, trial_end_date, created_at, updated_at, created_by, updated_by) FROM stdin;
c35ed0c1-77d2-42a3-83b2-1200da440013	29520ebc-4471-4270-9257-384562aefdce	premium	active	monthly	199.90	1999.00	BRL	2025-08-01 01:26:34.480162	2026-08-01 01:26:34.480162	2025-09-01 01:26:34.480162	\N	credit_card	\N	\N	\N	t	7	["unlimited_products", "advanced_analytics", "priority_support", "custom_branding"]	-1	10	\N	\N	f	\N	2025-08-01 01:26:34.480162	2025-08-01 01:26:34.480162	e87b4cf1-1010-4d04-9b64-9cc606df5b61	\N
1d04c939-e9f6-4345-aeea-a604d44ce291	003bbaf7-5c5f-4618-80bc-027fc90fb7d5	basic	active	monthly	99.90	999.00	BRL	2025-08-01 01:26:34.480162	2026-08-01 01:26:34.480162	2025-09-01 01:26:34.480162	\N	pix	\N	\N	\N	t	7	["up_to_1000_products", "basic_analytics", "email_support"]	1000	3	\N	\N	f	\N	2025-08-01 01:26:34.480162	2025-08-01 01:26:34.480162	e87b4cf1-1010-4d04-9b64-9cc606df5b61	\N
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sessions (id, user_id, session_token, refresh_token, expires_at, ip_address, user_agent, device_type, device_os, device_browser, location_country, location_city, is_active, last_activity, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password_hash, name, phone, role, status, avatar_url, date_of_birth, gender, address_street, address_city, address_state, address_zip_code, address_country, preferred_language, timezone, email_notifications, push_notifications, email_verified, email_verification_token, email_verification_expires, password_reset_token, password_reset_expires, two_factor_enabled, two_factor_secret, last_login, last_login_ip, login_count, failed_login_attempts, account_locked_until, created_at, updated_at, created_by, updated_by) FROM stdin;
e87b4cf1-1010-4d04-9b64-9cc606df5b61	admin@precivox.com.br	$2b$12$LQv3c1yqBwrVHpgk6TlVaOQNvApyHB3GOwO6qRJfL1TrABQCKGASu	Administrador PRECIVOX	\N	admin	active	\N	\N	\N	\N	São Paulo	SP	\N	Brasil	pt-BR	America/Sao_Paulo	t	t	t	\N	\N	\N	\N	f	\N	\N	\N	0	0	\N	2025-08-01 01:26:34.468935	2025-08-01 01:26:34.468935	\N	\N
\.


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: json_uploads json_uploads_market_id_file_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.json_uploads
    ADD CONSTRAINT json_uploads_market_id_file_hash_key UNIQUE (market_id, file_hash);


--
-- Name: json_uploads json_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.json_uploads
    ADD CONSTRAINT json_uploads_pkey PRIMARY KEY (id);


--
-- Name: market_users market_users_market_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_users
    ADD CONSTRAINT market_users_market_id_user_id_key UNIQUE (market_id, user_id);


--
-- Name: market_users market_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_users
    ADD CONSTRAINT market_users_pkey PRIMARY KEY (id);


--
-- Name: markets markets_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_cnpj_key UNIQUE (cnpj);


--
-- Name: markets markets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_pkey PRIMARY KEY (id);


--
-- Name: markets markets_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_slug_key UNIQUE (slug);


--
-- Name: product_categories product_categories_market_id_categoria_subcategoria_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_market_id_categoria_subcategoria_key UNIQUE (market_id, categoria, subcategoria);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: products products_market_id_external_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_market_id_external_id_key UNIQUE (market_id, external_id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: subscription_history subscription_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_history
    ADD CONSTRAINT subscription_history_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_key UNIQUE (refresh_token);


--
-- Name: user_sessions user_sessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_resource_type_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_resource_type_id ON public.audit_logs USING btree (resource_type, resource_id);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_json_uploads_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_json_uploads_created_at ON public.json_uploads USING btree (created_at);


--
-- Name: idx_json_uploads_file_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_json_uploads_file_hash ON public.json_uploads USING btree (file_hash);


--
-- Name: idx_json_uploads_market_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_json_uploads_market_id ON public.json_uploads USING btree (market_id);


--
-- Name: idx_json_uploads_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_json_uploads_status ON public.json_uploads USING btree (status);


--
-- Name: idx_market_users_market_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_market_users_market_id ON public.market_users USING btree (market_id);


--
-- Name: idx_market_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_market_users_role ON public.market_users USING btree (role);


--
-- Name: idx_market_users_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_market_users_user_id ON public.market_users USING btree (user_id);


--
-- Name: idx_markets_city_state; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_markets_city_state ON public.markets USING btree (address_city, address_state);


--
-- Name: idx_markets_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_markets_created_at ON public.markets USING btree (created_at);


--
-- Name: idx_markets_location; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_markets_location ON public.markets USING btree (latitude, longitude);


--
-- Name: idx_markets_search_vector; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_markets_search_vector ON public.markets USING gin (search_vector);


--
-- Name: idx_markets_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_markets_slug ON public.markets USING btree (slug);


--
-- Name: idx_markets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_markets_status ON public.markets USING btree (status);


--
-- Name: idx_product_categories_categoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_categories_categoria ON public.product_categories USING btree (categoria);


--
-- Name: idx_product_categories_market_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_categories_market_id ON public.product_categories USING btree (market_id);


--
-- Name: idx_products_categoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_categoria ON public.products USING btree (categoria);


--
-- Name: idx_products_codigo_barras; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_codigo_barras ON public.products USING btree (codigo_barras);


--
-- Name: idx_products_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_created_at ON public.products USING btree (created_at);


--
-- Name: idx_products_external_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_external_id ON public.products USING btree (external_id);


--
-- Name: idx_products_market_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_market_id ON public.products USING btree (market_id);


--
-- Name: idx_products_preco; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_preco ON public.products USING btree (preco);


--
-- Name: idx_products_promocao; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_promocao ON public.products USING btree (promocao);


--
-- Name: idx_products_search_vector; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_search_vector ON public.products USING gin (search_vector);


--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_status ON public.products USING btree (status);


--
-- Name: idx_subscription_history_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscription_history_created_at ON public.subscription_history USING btree (created_at);


--
-- Name: idx_subscription_history_event_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscription_history_event_type ON public.subscription_history USING btree (event_type);


--
-- Name: idx_subscription_history_subscription_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscription_history_subscription_id ON public.subscription_history USING btree (subscription_id);


--
-- Name: idx_subscriptions_end_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_end_date ON public.subscriptions USING btree (end_date);


--
-- Name: idx_subscriptions_market_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_market_id ON public.subscriptions USING btree (market_id);


--
-- Name: idx_subscriptions_next_billing_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_next_billing_date ON public.subscriptions USING btree (next_billing_date);


--
-- Name: idx_subscriptions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscriptions_status ON public.subscriptions USING btree (status);


--
-- Name: idx_user_sessions_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions USING btree (expires_at);


--
-- Name: idx_user_sessions_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_is_active ON public.user_sessions USING btree (is_active);


--
-- Name: idx_user_sessions_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_token ON public.user_sessions USING btree (session_token);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: idx_users_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_last_login; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_last_login ON public.users USING btree (last_login);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: products update_category_stats_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_category_stats_trigger AFTER INSERT OR DELETE OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_category_stats();


--
-- Name: markets update_market_search_vector_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_market_search_vector_trigger BEFORE INSERT OR UPDATE ON public.markets FOR EACH ROW EXECUTE FUNCTION public.update_market_search_vector();


--
-- Name: market_users update_market_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_market_users_updated_at BEFORE UPDATE ON public.market_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: markets update_markets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON public.markets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: product_categories update_product_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_product_search_vector_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_product_search_vector_trigger BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_product_search_vector();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscriptions update_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.user_sessions(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: json_uploads json_uploads_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.json_uploads
    ADD CONSTRAINT json_uploads_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: json_uploads json_uploads_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.json_uploads
    ADD CONSTRAINT json_uploads_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: market_users market_users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_users
    ADD CONSTRAINT market_users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: market_users market_users_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_users
    ADD CONSTRAINT market_users_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: market_users market_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.market_users
    ADD CONSTRAINT market_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: markets markets_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: markets markets_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.markets
    ADD CONSTRAINT markets_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: product_categories product_categories_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: products products_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: products products_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: products products_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: subscription_history subscription_history_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_history
    ADD CONSTRAINT subscription_history_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: subscription_history subscription_history_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription_history
    ADD CONSTRAINT subscription_history_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: subscriptions subscriptions_market_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_market_id_fkey FOREIGN KEY (market_id) REFERENCES public.markets(id) ON DELETE CASCADE;


--
-- Name: subscriptions subscriptions_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: users users_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

