'use client';

import React from 'react';
import Link from 'next/link';
import { TOKENS } from '@/styles/tokens';
import Logo from '@/components/Logo';

export default function PoliticaPrivacidade() {
  return (
    <>
      <header style={headerStyle}>
        <div style={containerStyle}>
          <Logo height={36} variant="white" />
        </div>
      </header>

      <main style={mainStyle}>
        <div style={contentStyle}>
          <h1 style={titleStyle}>Política de Privacidade</h1>
          <p style={subtitleStyle}>
            Última atualização: 16 de março de 2026
          </p>

          <Section title="1. Introdução">
            <p>
              A <strong>PRECIVOX</strong> (&quot;nós&quot;, &quot;nosso&quot; ou &quot;Plataforma&quot;) tem compromisso com a
              proteção da privacidade e dos dados pessoais dos seus usuários. Esta Política de Privacidade
              descreve como coletamos, utilizamos, armazenamos, compartilhamos e protegemos suas informações
              pessoais, em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais
              (Lei nº 13.709/2018 — LGPD)</strong>, o <strong>Marco Civil da Internet
              (Lei nº 12.965/2014)</strong> e demais normas aplicáveis.
            </p>
            <p>
              Ao utilizar a Plataforma PRECIVOX, você declara que leu, compreendeu e concorda com os
              termos desta Política. Caso não concorde, pedimos que não utilize nossos serviços.
            </p>
          </Section>

          <Section title="2. Controlador dos Dados">
            <p>
              O controlador dos dados pessoais tratados por esta Plataforma é:
            </p>
            <ul style={listStyle}>
              <li><strong>Razão Social:</strong> PRECIVOX Tecnologia Ltda.</li>
              <li><strong>E-mail do Encarregado (DPO):</strong> privacidade@precivox.com.br</li>
              <li><strong>Website:</strong> https://precivox.com.br</li>
            </ul>
          </Section>

          <Section title="3. Dados Pessoais Coletados">
            <h4 style={subheadingStyle}>3.1. Dados fornecidos diretamente por você</h4>
            <ul style={listStyle}>
              <li><strong>Dados de cadastro:</strong> nome, endereço de e-mail e senha (armazenada em formato criptografado irreversível — hash).</li>
              <li><strong>Dados de perfil de gestor/admin:</strong> informações relacionadas ao mercado gerenciado, como nome do estabelecimento, CNPJ, telefone e endereço.</li>
            </ul>

            <h4 style={subheadingStyle}>3.2. Dados coletados via login social (OAuth)</h4>
            <p>
              Se você optar por fazer login com <strong>Google</strong>, <strong>Facebook</strong> ou outro
              provedor social, coletamos as informações disponibilizadas pelo provedor, que podem incluir:
              nome, e-mail, foto de perfil e identificador da conta. Não temos acesso à sua senha do
              provedor social.
            </p>

            <h4 style={subheadingStyle}>3.3. Dados gerados pelo uso da Plataforma</h4>
            <ul style={listStyle}>
              <li><strong>Listas de compras:</strong> produtos adicionados, quantidades e status (comprado/pendente).</li>
              <li><strong>Histórico de economia:</strong> comparações de preço realizadas, economia obtida e produtos consultados.</li>
              <li><strong>Dados de navegação:</strong> páginas acessadas, funcionalidades utilizadas, data e horário de acesso.</li>
              <li><strong>Dados de sessão:</strong> endereço IP, tipo de navegador (user agent) e tokens de sessão para autenticação.</li>
            </ul>

            <h4 style={subheadingStyle}>3.4. Dados de notificações</h4>
            <p>
              Caso você autorize o recebimento de notificações push, armazenamos o token do dispositivo,
              a plataforma utilizada (web, Android, iOS) e sua preferência de ativação.
            </p>
          </Section>

          <Section title="4. Finalidades do Tratamento">
            <p>Utilizamos seus dados pessoais para as seguintes finalidades, sempre com base legal adequada:</p>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Finalidade</th>
                  <th style={thStyle}>Base Legal (LGPD)</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={tdStyle}>Criar e gerenciar sua conta</td><td style={tdStyle}>Execução de contrato (Art. 7º, V)</td></tr>
                <tr><td style={tdStyle}>Autenticar seu acesso (login)</td><td style={tdStyle}>Execução de contrato (Art. 7º, V)</td></tr>
                <tr><td style={tdStyle}>Comparar preços e gerar listas de compras</td><td style={tdStyle}>Execução de contrato (Art. 7º, V)</td></tr>
                <tr><td style={tdStyle}>Gerar recomendações e análises por IA</td><td style={tdStyle}>Legítimo interesse (Art. 7º, IX)</td></tr>
                <tr><td style={tdStyle}>Enviar notificações de alertas e ofertas</td><td style={tdStyle}>Consentimento (Art. 7º, I)</td></tr>
                <tr><td style={tdStyle}>Calcular economia e gamificação (badges, streaks)</td><td style={tdStyle}>Execução de contrato (Art. 7º, V)</td></tr>
                <tr><td style={tdStyle}>Programa de indicação (referral)</td><td style={tdStyle}>Execução de contrato (Art. 7º, V)</td></tr>
                <tr><td style={tdStyle}>Gestão de mercado e upload de base de dados</td><td style={tdStyle}>Execução de contrato (Art. 7º, V)</td></tr>
                <tr><td style={tdStyle}>Melhorar a Plataforma e corrigir erros</td><td style={tdStyle}>Legítimo interesse (Art. 7º, IX)</td></tr>
                <tr><td style={tdStyle}>Cumprir obrigações legais e regulatórias</td><td style={tdStyle}>Obrigação legal (Art. 7º, II)</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="5. Compartilhamento de Dados">
            <p>Seus dados pessoais <strong>não são vendidos</strong> a terceiros. Podemos compartilhá-los nas seguintes situações:</p>
            <ul style={listStyle}>
              <li><strong>Provedores de autenticação (Google, Facebook):</strong> apenas para viabilizar o login social, nos limites do protocolo OAuth.</li>
              <li><strong>Serviços de infraestrutura:</strong> provedores de hospedagem e banco de dados, sob contratos que garantem sigilo e segurança.</li>
              <li><strong>Cumprimento legal:</strong> quando exigido por lei, decisão judicial ou autoridade competente.</li>
              <li><strong>Proteção de direitos:</strong> para proteger os direitos, propriedade ou segurança da PRECIVOX, de seus usuários ou de terceiros.</li>
            </ul>
            <p>
              Não realizamos transferência internacional de dados. Todos os dados são armazenados e
              processados em servidores localizados no Brasil.
            </p>
          </Section>

          <Section title="6. Armazenamento e Segurança">
            <p>Adotamos medidas técnicas e administrativas para proteger seus dados pessoais:</p>
            <ul style={listStyle}>
              <li><strong>Criptografia:</strong> senhas são armazenadas com hash irreversível (bcrypt). Comunicações são protegidas por HTTPS/TLS.</li>
              <li><strong>Controle de acesso:</strong> acesso aos dados é restrito a pessoal autorizado, com autenticação multifator quando aplicável.</li>
              <li><strong>Tokens seguros:</strong> tokens de sessão e de atualização (refresh tokens) possuem expiração e podem ser revogados a qualquer momento.</li>
              <li><strong>Logs de auditoria:</strong> eventos de autenticação (login, logout, renovação de token) são registrados para fins de segurança.</li>
              <li><strong>Backups:</strong> backups periódicos com acesso restrito para garantir a recuperação de dados em caso de incidentes.</li>
            </ul>
            <p>
              Apesar de empregarmos os melhores esforços, nenhum sistema é 100% invulnerável. Em caso
              de incidente de segurança que possa acarretar risco relevante, notificaremos os titulares
              afetados e a Autoridade Nacional de Proteção de Dados (ANPD), conforme exigido pela LGPD.
            </p>
          </Section>

          <Section title="7. Retenção dos Dados">
            <ul style={listStyle}>
              <li><strong>Dados de conta:</strong> mantidos enquanto sua conta estiver ativa. Após solicitação de exclusão, são removidos em até 30 dias, salvo obrigação legal de retenção.</li>
              <li><strong>Dados de sessão e logs de auditoria:</strong> mantidos por até 6 meses para fins de segurança, conforme o Marco Civil da Internet.</li>
              <li><strong>Dados de uso e economia:</strong> mantidos enquanto a conta estiver ativa, podendo ser anonimizados para fins estatísticos após a exclusão da conta.</li>
              <li><strong>Dados de notificação push:</strong> removidos imediatamente após a revogação do consentimento ou exclusão da conta.</li>
            </ul>
          </Section>

          <Section title="8. Direitos do Titular (Art. 18 da LGPD)">
            <p>Você tem os seguintes direitos em relação aos seus dados pessoais:</p>
            <ol style={orderedListStyle}>
              <li><strong>Confirmação</strong> da existência de tratamento dos seus dados.</li>
              <li><strong>Acesso</strong> aos dados pessoais que mantemos sobre você.</li>
              <li><strong>Correção</strong> de dados incompletos, inexatos ou desatualizados.</li>
              <li><strong>Anonimização, bloqueio ou eliminação</strong> de dados desnecessários, excessivos ou tratados em desconformidade com a LGPD.</li>
              <li><strong>Portabilidade</strong> dos dados a outro fornecedor de serviço, mediante requisição expressa.</li>
              <li><strong>Eliminação</strong> dos dados tratados com base no consentimento.</li>
              <li><strong>Informação</strong> sobre as entidades públicas e privadas com as quais compartilhamos seus dados.</li>
              <li><strong>Informação</strong> sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa.</li>
              <li><strong>Revogação</strong> do consentimento a qualquer momento.</li>
            </ol>
            <p>
              Para exercer qualquer desses direitos, entre em contato pelo e-mail{' '}
              <a href="mailto:privacidade@precivox.com.br" style={linkStyle}>privacidade@precivox.com.br</a>.
              Responderemos em até <strong>15 dias úteis</strong>, conforme previsto na legislação.
            </p>
          </Section>

          <Section title="9. Cookies e Tecnologias Semelhantes">
            <p>A Plataforma utiliza cookies estritamente necessários para:</p>
            <ul style={listStyle}>
              <li><strong>Autenticação:</strong> manter sua sessão ativa após o login (cookies de sessão do NextAuth).</li>
              <li><strong>Segurança:</strong> token CSRF para proteção contra ataques de falsificação de requisições.</li>
              <li><strong>Preferências:</strong> armazenar escolhas como tema e idioma.</li>
            </ul>
            <p>
              Não utilizamos cookies de rastreamento publicitário de terceiros. Não realizamos
              perfilamento para fins de publicidade direcionada.
            </p>
          </Section>

          <Section title="10. Uso de Inteligência Artificial">
            <p>
              A Plataforma utiliza algoritmos de inteligência artificial para gerar recomendações de
              compras, alertas de preços e análises de mercado. Esses algoritmos processam dados de
              produtos, preços e padrões de consumo de forma agregada.
            </p>
            <p>
              Nenhuma decisão automatizada com efeitos legais significativos é tomada exclusivamente
              com base em tratamento automatizado de dados pessoais. Você pode solicitar a revisão de
              qualquer análise gerada por IA entrando em contato conosco.
            </p>
          </Section>

          <Section title="11. Menores de Idade">
            <p>
              A Plataforma PRECIVOX não é direcionada a menores de 18 anos. Não coletamos
              intencionalmente dados de crianças ou adolescentes. Caso tome conhecimento de que um
              menor forneceu dados pessoais sem o consentimento dos pais ou responsáveis legais,
              entre em contato para que possamos adotar as medidas cabíveis.
            </p>
          </Section>

          <Section title="12. Alterações nesta Política">
            <p>
              Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças
              em nossas práticas ou na legislação aplicável. Em caso de alterações substanciais,
              notificaremos você por meio da Plataforma ou do e-mail cadastrado.
            </p>
            <p>
              Recomendamos que revise esta página periodicamente. A data da última atualização está
              indicada no topo deste documento.
            </p>
          </Section>

          <Section title="13. Legislação Aplicável e Foro">
            <p>
              Esta Política é regida pelas leis da República Federativa do Brasil. Para dirimir
              quaisquer controvérsias decorrentes desta Política, fica eleito o foro da Comarca do
              domicílio do titular dos dados, conforme previsto no Código de Defesa do Consumidor
              (Lei nº 8.078/1990).
            </p>
          </Section>

          <Section title="14. Contato">
            <p>
              Em caso de dúvidas, sugestões ou para exercer seus direitos como titular de dados,
              entre em contato com nosso Encarregado de Proteção de Dados (DPO):
            </p>
            <div style={contactBoxStyle}>
              <p><strong>E-mail:</strong> privacidade@precivox.com.br</p>
              <p><strong>Website:</strong> https://precivox.com.br</p>
            </div>
          </Section>
        </div>
      </main>

      <footer style={footerStyle}>
        <div style={containerStyle}>
          <p style={footerTextStyle}>
            © {new Date().getFullYear()} PRECIVOX — Economia Inteligente para Todos
          </p>
          <div style={footerLinksStyle}>
            <Link href="/" style={footerLinkStyle}>Início</Link>
            <span style={footerSepStyle}>•</span>
            <Link href="/termos" style={footerLinkStyle}>Termos de Uso</Link>
            <span style={footerSepStyle}>•</span>
            <a href="mailto:privacidade@precivox.com.br" style={footerLinkStyle}>Contato</a>
          </div>
        </div>
      </footer>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={sectionStyle}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <div style={sectionBodyStyle}>{children}</div>
    </section>
  );
}

const headerStyle: React.CSSProperties = {
  backgroundColor: TOKENS.colors.primary[700],
  padding: `${TOKENS.spacing[4]} 0`,
  position: 'sticky',
  top: 0,
  zIndex: 50,
};

const containerStyle: React.CSSProperties = {
  maxWidth: '900px',
  margin: '0 auto',
  padding: `0 ${TOKENS.spacing[4]}`,
};

const logoLinkStyle: React.CSSProperties = {
  color: TOKENS.colors.text.inverse,
  textDecoration: 'none',
  fontSize: TOKENS.typography.fontSize.xl,
  fontWeight: TOKENS.typography.fontWeight.extrabold,
  letterSpacing: '1.5px',
};

const mainStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: TOKENS.colors.background,
  paddingBottom: TOKENS.spacing[16],
};

const contentStyle: React.CSSProperties = {
  maxWidth: '900px',
  margin: '0 auto',
  padding: `${TOKENS.spacing[8]} ${TOKENS.spacing[4]}`,
};

const titleStyle: React.CSSProperties = {
  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
  fontWeight: TOKENS.typography.fontWeight.extrabold,
  color: TOKENS.colors.text.primary,
  marginBottom: TOKENS.spacing[2],
};

const subtitleStyle: React.CSSProperties = {
  fontSize: TOKENS.typography.fontSize.sm,
  color: TOKENS.colors.text.secondary,
  marginBottom: TOKENS.spacing[8],
  paddingBottom: TOKENS.spacing[6],
  borderBottom: `1px solid ${TOKENS.colors.gray[200]}`,
};

const sectionStyle: React.CSSProperties = {
  marginBottom: TOKENS.spacing[8],
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: TOKENS.typography.fontSize.xl,
  fontWeight: TOKENS.typography.fontWeight.bold,
  color: TOKENS.colors.primary[700],
  marginBottom: TOKENS.spacing[4],
  paddingBottom: TOKENS.spacing[2],
  borderBottom: `2px solid ${TOKENS.colors.primary[100]}`,
};

const sectionBodyStyle: React.CSSProperties = {
  fontSize: TOKENS.typography.fontSize.base,
  lineHeight: TOKENS.typography.lineHeight.relaxed,
  color: TOKENS.colors.text.primary,
};

const subheadingStyle: React.CSSProperties = {
  fontSize: TOKENS.typography.fontSize.base,
  fontWeight: TOKENS.typography.fontWeight.semibold,
  color: TOKENS.colors.text.primary,
  marginTop: TOKENS.spacing[4],
  marginBottom: TOKENS.spacing[2],
};

const listStyle: React.CSSProperties = {
  paddingLeft: TOKENS.spacing[6],
  marginBottom: TOKENS.spacing[4],
  listStyleType: 'disc',
  display: 'flex',
  flexDirection: 'column',
  gap: TOKENS.spacing[2],
};

const orderedListStyle: React.CSSProperties = {
  paddingLeft: TOKENS.spacing[6],
  marginBottom: TOKENS.spacing[4],
  listStyleType: 'decimal',
  display: 'flex',
  flexDirection: 'column',
  gap: TOKENS.spacing[2],
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: TOKENS.spacing[4],
  marginBottom: TOKENS.spacing[4],
  fontSize: TOKENS.typography.fontSize.sm,
};

const thStyle: React.CSSProperties = {
  backgroundColor: TOKENS.colors.primary[50],
  color: TOKENS.colors.primary[800],
  padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
  textAlign: 'left',
  fontWeight: TOKENS.typography.fontWeight.semibold,
  borderBottom: `2px solid ${TOKENS.colors.primary[200]}`,
};

const tdStyle: React.CSSProperties = {
  padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
  borderBottom: `1px solid ${TOKENS.colors.gray[200]}`,
  verticalAlign: 'top',
};

const linkStyle: React.CSSProperties = {
  color: TOKENS.colors.primary[600],
  textDecoration: 'underline',
};

const contactBoxStyle: React.CSSProperties = {
  backgroundColor: TOKENS.colors.primary[50],
  border: `1px solid ${TOKENS.colors.primary[200]}`,
  borderRadius: TOKENS.borderRadius.lg,
  padding: TOKENS.spacing[6],
  marginTop: TOKENS.spacing[4],
};

const footerStyle: React.CSSProperties = {
  padding: `${TOKENS.spacing[8]} 0`,
  backgroundColor: TOKENS.colors.gray[900],
  color: TOKENS.colors.text.inverse,
  textAlign: 'center',
};

const footerTextStyle: React.CSSProperties = {
  fontSize: TOKENS.typography.fontSize.sm,
  marginBottom: TOKENS.spacing[4],
  opacity: 0.8,
};

const footerLinksStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: TOKENS.spacing[2],
  flexWrap: 'wrap',
};

const footerLinkStyle: React.CSSProperties = {
  color: TOKENS.colors.text.inverse,
  textDecoration: 'none',
  fontSize: TOKENS.typography.fontSize.sm,
  opacity: 0.8,
};

const footerSepStyle: React.CSSProperties = {
  opacity: 0.5,
};
