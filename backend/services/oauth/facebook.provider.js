/**
 * Facebook (Meta) OAuth 2.0 adapter.
 *
 * Facebook não emite um id_token OIDC no fluxo web clássico, então trocamos o
 * code por access_token e consultamos o Graph API (/me) para o perfil.
 * E-mails do Facebook são considerados verificados pela Meta.
 *
 * Env necessários: FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET
 */
const GRAPH_VERSION = process.env.FACEBOOK_GRAPH_VERSION || 'v19.0';
const TOKEN_ENDPOINT = `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`;
const ME_ENDPOINT = `https://graph.facebook.com/${GRAPH_VERSION}/me`;

export const facebookProvider = {
  name: 'FACEBOOK',

  async exchangeAndVerify({ code, redirectUri }) {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error('FACEBOOK_CLIENT_ID/FACEBOOK_CLIENT_SECRET ausentes');
    }

    const tokenUrl = new URL(TOKEN_ENDPOINT);
    tokenUrl.searchParams.set('client_id', clientId);
    tokenUrl.searchParams.set('client_secret', clientSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl, { method: 'GET' });
    const tokens = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokens.access_token) {
      throw new Error(`Falha na troca de code (Facebook): ${tokens.error?.message || tokenRes.status}`);
    }

    const meUrl = new URL(ME_ENDPOINT);
    meUrl.searchParams.set('fields', 'id,name,email,picture.type(large)');
    meUrl.searchParams.set('access_token', tokens.access_token);

    const meRes = await fetch(meUrl, { method: 'GET' });
    const me = await meRes.json().catch(() => ({}));
    if (!meRes.ok || !me.id) {
      throw new Error(`Falha ao obter perfil (Facebook): ${me.error?.message || meRes.status}`);
    }

    return {
      sub: String(me.id),
      email: me.email ? String(me.email).toLowerCase() : null,
      // Meta valida o e-mail da conta; consideramos verificado quando presente.
      emailVerified: Boolean(me.email),
      isPrivateRelay: false,
      name: me.name ?? null,
      avatar: me.picture?.data?.url ?? null,
      providerAccessToken: tokens.access_token ?? null,
      providerRefreshToken: null,
      providerTokenExpires: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      raw: me,
    };
  },
};

export default facebookProvider;
