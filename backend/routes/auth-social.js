/**
 * Rotas de autenticação social + OTP — Backend Express (contrato /api/v1).
 *
 * Montado em /api/v1/auth (atrás de internalOnly). As rotas públicas
 * (callback social e OTP) são isentas do validateJWT/checkTokenVersion via
 * PUBLIC_PATHS nesses middlewares. /social/link exige sessão.
 *
 * Responsabilidades (Auth Hardening v7.0):
 *  - Validar o grant code no provedor (adapters OAuth).
 *  - Aplicar a regra de vinculação (Single Source of Truth) na tabela Prisma.
 *  - Finalizar emitindo nossos tokens nativos (issueTokenPair / HS512 + refresh rotativo).
 */
import express from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { issueTokenPair } from '../lib/token-issuer.js';
import { getProviderAdapter } from '../services/oauth/registry.js';
import { otpService } from '../services/sms/otp.service.js';

const router = express.Router();

function genUserId() {
  return `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

async function audit(event, userId, req, metadata = {}) {
  try {
    await prisma.authAuditLog.create({
      data: {
        userId: userId ?? null,
        event,
        ip: req.ip ?? null,
        userAgent: req.get('user-agent') ?? null,
        metadata,
      },
    });
  } catch (e) {
    console.error('[auth-social] falha ao gravar auditoria:', e);
  }
}

/**
 * Linking canônico (Single Source of Truth):
 *  1) identidade (provider, sub) existe -> login direto
 *  2) e-mail VERIFICADO já existe em User -> vincula nova identidade
 *  3) novo usuário -> cria User (onboarding com dados do provedor)
 *
 * @param {{ provider, sub, email, emailVerified, isPrivateRelay?, name?, avatar?,
 *           providerAccessToken?, providerRefreshToken?, providerTokenExpires?, raw? }} p
 * @param {string|null} forceUserId - quando vinculando a uma conta já logada
 */
async function resolveUser(p, forceUserId = null) {
  const existing = await prisma.socialIdentity.findUnique({
    where: { provider_providerSub: { provider: p.provider, providerSub: p.sub } },
    include: { user: true },
  });

  // Vinculação explícita (usuário logado adicionando provedor)
  if (forceUserId) {
    if (existing && existing.userId !== forceUserId) {
      const err = new Error('Esta identidade já está vinculada a outra conta.');
      err.statusCode = 409;
      throw err;
    }
    const identity = await prisma.socialIdentity.upsert({
      where: { provider_providerSub: { provider: p.provider, providerSub: p.sub } },
      create: {
        userId: forceUserId,
        provider: p.provider,
        providerSub: p.sub,
        email: p.email,
        emailVerified: !!p.emailVerified,
        isPrivateRelay: !!p.isPrivateRelay,
        displayName: p.name,
        avatarUrl: p.avatar,
        providerAccessToken: p.providerAccessToken,
        providerRefreshToken: p.providerRefreshToken,
        providerTokenExpires: p.providerTokenExpires,
        rawProfile: p.raw,
      },
      update: { email: p.email, avatarUrl: p.avatar ?? undefined },
      include: { user: true },
    });
    return { user: identity.user, linked: true, created: false };
  }

  // 1) identidade existe
  if (existing) {
    await prisma.socialIdentity.update({
      where: { id: existing.id },
      data: {
        email: p.email ?? existing.email,
        avatarUrl: p.avatar ?? existing.avatarUrl,
        displayName: p.name ?? existing.displayName,
        providerAccessToken: p.providerAccessToken ?? existing.providerAccessToken,
        providerRefreshToken: p.providerRefreshToken ?? existing.providerRefreshToken,
        providerTokenExpires: p.providerTokenExpires ?? existing.providerTokenExpires,
      },
    });
    return { user: existing.user, linked: false, created: false };
  }

  // 2) vincular a User existente SOMENTE com e-mail verificado (anti-takeover)
  if (p.email && p.emailVerified) {
    const userByEmail = await prisma.user.findUnique({ where: { email: p.email } });
    if (userByEmail) {
      await prisma.socialIdentity.create({
        data: {
          userId: userByEmail.id,
          provider: p.provider,
          providerSub: p.sub,
          email: p.email,
          emailVerified: true,
          isPrivateRelay: !!p.isPrivateRelay,
          displayName: p.name,
          avatarUrl: p.avatar,
          providerAccessToken: p.providerAccessToken,
          providerRefreshToken: p.providerRefreshToken,
          providerTokenExpires: p.providerTokenExpires,
          rawProfile: p.raw,
        },
      });
      // Completa avatar/nome se faltarem no usuário
      await prisma.user.update({
        where: { id: userByEmail.id },
        data: {
          imagem: userByEmail.imagem ?? p.avatar ?? undefined,
          nome: userByEmail.nome ?? p.name ?? undefined,
          dataAtualizacao: new Date(),
        },
      });
      return { user: userByEmail, linked: true, created: false };
    }
  }

  // 3) novo usuário (onboarding inteligente)
  const fallbackEmail = `${p.provider.toLowerCase()}_${p.sub}@no-email.precivox`;
  const user = await prisma.user.create({
    data: {
      id: genUserId(),
      nome: p.name ?? null,
      email: p.email ?? fallbackEmail,
      emailVerified: p.email && p.emailVerified ? new Date() : null,
      imagem: p.avatar ?? null,
      role: 'CLIENTE',
      dataAtualizacao: new Date(),
      socialIdentities: {
        create: {
          provider: p.provider,
          providerSub: p.sub,
          email: p.email,
          emailVerified: !!p.emailVerified,
          isPrivateRelay: !!p.isPrivateRelay,
          displayName: p.name,
          avatarUrl: p.avatar,
          providerAccessToken: p.providerAccessToken,
          providerRefreshToken: p.providerRefreshToken,
          providerTokenExpires: p.providerTokenExpires,
          rawProfile: p.raw,
        },
      },
    },
  });
  return { user, linked: false, created: true };
}

function buildAuthResponse(user, pair) {
  return {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        imagem: user.imagem,
      },
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      expiresAt: pair.expiresAt,
    },
  };
}

// =====================================================
// POST /api/v1/auth/social/callback  (público no contrato)
// Body: { provider, code, codeVerifier?, redirectUri, profileName? }
// =====================================================
router.post('/social/callback', async (req, res) => {
  const { provider, code, codeVerifier, redirectUri, profileName } = req.body ?? {};
  if (!provider || !code || !redirectUri) {
    return res.status(400).json({ success: false, error: 'provider, code e redirectUri são obrigatórios' });
  }

  try {
    const adapter = getProviderAdapter(provider);
    const profile = await adapter.exchangeAndVerify({ code, codeVerifier, redirectUri, profileName });

    const { user, created, linked } = await resolveUser({ provider: provider.toUpperCase(), ...profile });

    const pair = await issueTokenPair(
      { id: user.id, email: user.email, role: user.role, nome: user.nome, tokenVersion: user.tokenVersion ?? 0 },
      { ip: req.ip, userAgent: req.get('user-agent') }
    );

    await prisma.user.update({ where: { id: user.id }, data: { ultimoLogin: new Date() } });
    await audit('social_login_success', user.id, req, { provider, created, linked });

    return res.json(buildAuthResponse(user, pair));
  } catch (err) {
    console.error('[auth-social/callback]', err);
    await audit('social_login_failure', null, req, { provider, error: String(err?.message || err) });
    return res.status(err.statusCode || 401).json({ success: false, error: 'Falha na autenticação social' });
  }
});

// =====================================================
// POST /api/v1/auth/social/link  (autenticado: vincula provedor à conta logada)
// Body: { provider, code, codeVerifier?, redirectUri, profileName? }
// =====================================================
router.post('/social/link', async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, error: 'Não autenticado' });
  }
  const { provider, code, codeVerifier, redirectUri, profileName } = req.body ?? {};
  if (!provider || !code || !redirectUri) {
    return res.status(400).json({ success: false, error: 'provider, code e redirectUri são obrigatórios' });
  }

  try {
    const adapter = getProviderAdapter(provider);
    const profile = await adapter.exchangeAndVerify({ code, codeVerifier, redirectUri, profileName });
    const { user } = await resolveUser({ provider: provider.toUpperCase(), ...profile }, req.user.id);
    await audit('social_link_success', user.id, req, { provider });
    return res.json({ success: true, data: { provider: provider.toUpperCase(), userId: user.id } });
  } catch (err) {
    console.error('[auth-social/link]', err);
    return res.status(err.statusCode || 400).json({ success: false, error: err.message || 'Falha ao vincular' });
  }
});

// =====================================================
// POST /api/v1/auth/otp/request  (público no contrato)
// Body: { phone, channel? }
// =====================================================
router.post('/otp/request', async (req, res) => {
  const { phone, channel = 'SMS' } = req.body ?? {};
  if (!/^\+\d{8,15}$/.test(phone ?? '')) {
    return res.status(400).json({ success: false, error: 'Telefone inválido. Use o formato E.164 (ex: +5511999999999).' });
  }
  if (!['SMS', 'WHATSAPP'].includes(channel)) {
    return res.status(400).json({ success: false, error: 'Canal inválido' });
  }

  try {
    const result = await otpService.request(phone, channel, { ip: req.ip, userAgent: req.get('user-agent') });
    await audit('otp_requested', null, req, { phone, channel });
    return res.json({ success: true, data: { channel: result.channel, expiresInSeconds: result.expiresInSeconds } });
  } catch (err) {
    console.error('[auth-social/otp/request]', err);
    return res.status(500).json({ success: false, error: 'Não foi possível enviar o código agora.' });
  }
});

// =====================================================
// POST /api/v1/auth/otp/verify  (público no contrato)
// Body: { phone, code }
// =====================================================
router.post('/otp/verify', async (req, res) => {
  const { phone, code } = req.body ?? {};
  if (!phone || !code) {
    return res.status(400).json({ success: false, error: 'phone e code são obrigatórios' });
  }

  try {
    const ok = await otpService.verify(phone, code);
    if (!ok) {
      await audit('otp_verify_failure', null, req, { phone });
      return res.status(401).json({ success: false, error: 'Código inválido ou expirado.' });
    }

    const { user, created } = await resolveUser({
      provider: 'PHONE',
      sub: phone,
      email: null,
      emailVerified: false,
      name: null,
      avatar: null,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { phone, phoneVerified: new Date(), ultimoLogin: new Date() },
    });

    const pair = await issueTokenPair(
      { id: user.id, email: user.email, role: user.role, nome: user.nome, tokenVersion: user.tokenVersion ?? 0 },
      { ip: req.ip, userAgent: req.get('user-agent') }
    );

    await audit('otp_login_success', user.id, req, { phone, created });
    return res.json(buildAuthResponse(user, pair));
  } catch (err) {
    console.error('[auth-social/otp/verify]', err);
    return res.status(500).json({ success: false, error: 'Erro ao validar o código.' });
  }
});

export default router;
