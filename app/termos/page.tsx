'use client';

import React from 'react';
import Link from 'next/link';
import { TOKENS } from '@/styles/tokens';
import Logo from '@/components/Logo';

export default function TermosDeServico() {
  return (
    <>
      <header style={headerStyle}>
        <div style={containerStyle}>
          <Logo height={36} variant="white" />
        </div>
      </header>

      <main style={mainStyle}>
        <div style={contentStyle}>
          <h1 style={titleStyle}>Termos de Serviço</h1>
          <p style={subtitleStyle}>
            Última atualização: 16 de março de 2026
          </p>

          <Section title="1. Aceitação dos Termos">
            <p>
              Ao acessar ou utilizar a plataforma <strong>PRECIVOX</strong> (&quot;Plataforma&quot;),
              disponível em <strong>https://precivox.com.br</strong>, você concorda integralmente com
              estes Termos de Serviço. Caso não concorde com qualquer disposição, não utilize a Plataforma.
            </p>
            <p>
              Estes Termos constituem um contrato vinculante entre você (&quot;Usuário&quot;) e a
              <strong> PRECIVOX Tecnologia Ltda.</strong> (&quot;PRECIVOX&quot;, &quot;nós&quot;
              ou &quot;nosso&quot;), regido pelas leis da República Federativa do Brasil, em especial
              pelo <strong>Código de Defesa do Consumidor (Lei nº 8.078/1990)</strong>, pelo{' '}
              <strong>Marco Civil da Internet (Lei nº 12.965/2014)</strong> e pela{' '}
              <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD)</strong>.
            </p>
          </Section>

          <Section title="2. Descrição do Serviço">
            <p>A PRECIVOX é uma plataforma de economia inteligente que oferece:</p>
            <ul style={listStyle}>
              <li><strong>Comparação de preços:</strong> consulta e comparação de preços de produtos em supermercados e estabelecimentos da sua região.</li>
              <li><strong>Listas de compras:</strong> criação e gerenciamento de listas de compras com cálculo automático de economia.</li>
              <li><strong>Recomendações por IA:</strong> sugestões inteligentes de produtos, ofertas e melhores locais para compra.</li>
              <li><strong>Alertas de preço:</strong> notificações sobre variações de preço e promoções de produtos acompanhados.</li>
              <li><strong>Gestão de mercado:</strong> ferramentas para gestores de estabelecimentos gerenciarem produtos, preços e base de dados.</li>
              <li><strong>Gamificação:</strong> sistema de badges, streaks e programa de indicação para incentivar o uso da Plataforma.</li>
            </ul>
          </Section>

          <Section title="3. Cadastro e Conta do Usuário">
            <h4 style={subheadingStyle}>3.1. Requisitos</h4>
            <p>
              Para utilizar a Plataforma, você deve ter pelo menos <strong>18 anos de idade</strong> e
              capacidade civil plena. Ao se cadastrar, você declara que atende a esses requisitos.
            </p>

            <h4 style={subheadingStyle}>3.2. Criação de conta</h4>
            <p>
              O cadastro pode ser realizado por e-mail e senha ou por meio de login social
              (Google, Facebook). Você é responsável por fornecer informações verdadeiras, completas
              e atualizadas.
            </p>

            <h4 style={subheadingStyle}>3.3. Segurança da conta</h4>
            <p>
              Você é o único responsável pela confidencialidade de suas credenciais de acesso.
              Qualquer atividade realizada em sua conta será considerada de sua responsabilidade.
              Caso suspeite de uso não autorizado, notifique-nos imediatamente pelo e-mail{' '}
              <a href="mailto:suporte@precivox.com.br" style={linkStyle}>suporte@precivox.com.br</a>.
            </p>

            <h4 style={subheadingStyle}>3.4. Tipos de conta</h4>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={tdStyle}><strong>Cliente</strong></td><td style={tdStyle}>Usuário consumidor que compara preços, cria listas e acompanha economia.</td></tr>
                <tr><td style={tdStyle}><strong>Gestor</strong></td><td style={tdStyle}>Responsável por um estabelecimento, com acesso a ferramentas de gestão de produtos, upload de base de dados e análises de IA.</td></tr>
                <tr><td style={tdStyle}><strong>Administrador</strong></td><td style={tdStyle}>Equipe PRECIVOX com acesso completo para gerenciamento da Plataforma.</td></tr>
              </tbody>
            </table>
          </Section>

          <Section title="4. Uso Permitido">
            <p>Ao utilizar a Plataforma, você concorda em:</p>
            <ul style={listStyle}>
              <li>Utilizar a Plataforma apenas para fins pessoais, legítimos e não comerciais (exceto gestores de estabelecimentos no âmbito do seu negócio).</li>
              <li>Não reproduzir, copiar, vender, revender ou explorar comercialmente qualquer parte da Plataforma sem autorização prévia.</li>
              <li>Não utilizar robôs, crawlers, scrapers ou mecanismos automatizados para acessar ou coletar dados da Plataforma.</li>
              <li>Não tentar acessar áreas restritas, sistemas ou redes sem autorização.</li>
              <li>Não publicar, enviar ou transmitir conteúdo ilegal, ofensivo, difamatório, discriminatório ou que viole direitos de terceiros.</li>
              <li>Não interferir no funcionamento normal da Plataforma ou sobrecarregar sua infraestrutura.</li>
            </ul>
          </Section>

          <Section title="5. Upload de Dados (Gestores)">
            <p>
              Os gestores de estabelecimentos podem enviar bases de dados contendo informações de
              produtos (nomes, preços, quantidades, categorias) por meio de arquivos CSV, XLSX ou JSON.
            </p>
            <ul style={listStyle}>
              <li>O gestor declara que possui autorização para compartilhar os dados enviados e que estes não violam direitos de terceiros.</li>
              <li>Os dados enviados referem-se exclusivamente a produtos e preços do estabelecimento, não contendo dados pessoais de terceiros.</li>
              <li>A PRECIVOX não se responsabiliza pela exatidão dos preços informados pelos gestores.</li>
              <li>Reservamo-nos o direito de remover dados que consideremos incorretos, incompletos ou potencialmente fraudulentos.</li>
            </ul>
          </Section>

          <Section title="6. Preços e Informações de Produtos">
            <p>
              A PRECIVOX exibe informações de preços fornecidas pelos estabelecimentos cadastrados.
            </p>
            <ul style={listStyle}>
              <li>Os preços exibidos são <strong>informativos</strong> e podem não refletir o valor praticado no momento da compra presencial.</li>
              <li>A PRECIVOX <strong>não vende produtos</strong> e não intermedia transações comerciais entre consumidores e estabelecimentos.</li>
              <li>Não garantimos a disponibilidade ou o estoque dos produtos listados.</li>
              <li>Diferenças entre o preço exibido na Plataforma e o preço praticado no estabelecimento são de responsabilidade do respectivo estabelecimento.</li>
            </ul>
          </Section>

          <Section title="7. Propriedade Intelectual">
            <p>
              Todo o conteúdo da Plataforma — incluindo, mas não se limitando a, textos, imagens,
              logotipos, ícones, código-fonte, design, layout, algoritmos e análises geradas por
              inteligência artificial — é de propriedade exclusiva da PRECIVOX ou de seus licenciadores,
              protegido pela legislação brasileira de propriedade intelectual.
            </p>
            <ul style={listStyle}>
              <li>É concedida ao Usuário uma licença limitada, não exclusiva, intransferível e revogável para uso pessoal da Plataforma.</li>
              <li>Esta licença não autoriza modificação, distribuição, reprodução ou criação de obras derivadas sem autorização expressa.</li>
              <li>As marcas &quot;PRECIVOX&quot; e &quot;Economia Inteligente&quot; são de titularidade da PRECIVOX Tecnologia Ltda.</li>
            </ul>
          </Section>

          <Section title="8. Inteligência Artificial">
            <p>
              A Plataforma utiliza algoritmos de inteligência artificial para gerar recomendações,
              alertas, análises de preço e previsões de demanda.
            </p>
            <ul style={listStyle}>
              <li>As análises e recomendações geradas por IA são <strong>sugestões auxiliares</strong> e não devem ser interpretadas como aconselhamento financeiro, comercial ou de qualquer outra natureza profissional.</li>
              <li>A PRECIVOX não garante a precisão ou completude das análises geradas por IA.</li>
              <li>Decisões tomadas com base nas informações da Plataforma são de responsabilidade exclusiva do Usuário.</li>
            </ul>
          </Section>

          <Section title="9. Disponibilidade do Serviço">
            <p>
              A PRECIVOX emprega esforços razoáveis para manter a Plataforma disponível
              24 horas por dia, 7 dias por semana. No entanto:
            </p>
            <ul style={listStyle}>
              <li>O serviço pode sofrer interrupções programadas para manutenção, atualizações ou melhorias.</li>
              <li>Não garantimos disponibilidade ininterrupta ou livre de erros.</li>
              <li>A PRECIVOX não será responsável por indisponibilidades causadas por fatores alheios ao nosso controle, como falhas de internet, de provedores de infraestrutura ou casos de força maior.</li>
            </ul>
          </Section>

          <Section title="10. Planos e Pagamentos">
            <p>
              A Plataforma pode oferecer funcionalidades gratuitas e planos pagos com recursos adicionais.
            </p>
            <ul style={listStyle}>
              <li>Os planos pagos, quando disponíveis, terão seus preços e condições divulgados na Plataforma no momento da contratação.</li>
              <li>O Usuário poderá cancelar sua assinatura a qualquer momento, nos termos do plano contratado.</li>
              <li>Em caso de cancelamento, funcionalidades exclusivas do plano pago serão desativadas ao final do período já pago.</li>
              <li>Aplica-se o direito de arrependimento previsto no Art. 49 do Código de Defesa do Consumidor: o Usuário pode desistir da contratação no prazo de 7 dias a contar da assinatura, com reembolso integral dos valores pagos.</li>
            </ul>
          </Section>

          <Section title="11. Privacidade e Proteção de Dados">
            <p>
              O tratamento de dados pessoais é regido pela nossa{' '}
              <Link href="/privacidade" style={linkStyle}>Política de Privacidade</Link>,
              que é parte integrante destes Termos. Ao utilizar a Plataforma, você declara que leu
              e concordou com a Política de Privacidade.
            </p>
          </Section>

          <Section title="12. Limitação de Responsabilidade">
            <ul style={listStyle}>
              <li>A PRECIVOX não se responsabiliza por danos indiretos, incidentais, especiais, consequenciais ou punitivos decorrentes do uso ou da incapacidade de uso da Plataforma.</li>
              <li>Não nos responsabilizamos por decisões de compra tomadas pelo Usuário com base nas informações da Plataforma.</li>
              <li>Não nos responsabilizamos por conteúdos, produtos, preços ou serviços de terceiros (estabelecimentos cadastrados).</li>
              <li>A responsabilidade total da PRECIVOX, em qualquer hipótese, estará limitada ao valor pago pelo Usuário nos últimos 12 meses, ou R$ 100,00 (cem reais), o que for maior.</li>
            </ul>
            <p>
              As limitações acima não se aplicam nos casos em que a legislação brasileira proíba tais
              limitações, incluindo casos de dolo ou culpa grave.
            </p>
          </Section>

          <Section title="13. Indenização">
            <p>
              O Usuário concorda em indenizar e isentar a PRECIVOX, seus diretores, funcionários e
              parceiros de qualquer reclamação, demanda, perda ou dano decorrente de:
            </p>
            <ul style={listStyle}>
              <li>Violação destes Termos pelo Usuário.</li>
              <li>Uso indevido da Plataforma.</li>
              <li>Violação de direitos de terceiros.</li>
              <li>Upload de dados imprecisos, fraudulentos ou que violem a legislação aplicável.</li>
            </ul>
          </Section>

          <Section title="14. Suspensão e Encerramento">
            <h4 style={subheadingStyle}>14.1. Pela PRECIVOX</h4>
            <p>Podemos suspender ou encerrar sua conta, a qualquer momento, caso:</p>
            <ul style={listStyle}>
              <li>Haja violação destes Termos ou de qualquer legislação aplicável.</li>
              <li>O Usuário utilize a Plataforma de forma que comprometa sua integridade, segurança ou desempenho.</li>
              <li>Haja suspeita fundamentada de fraude ou uso indevido.</li>
            </ul>
            <p>Sempre que possível, notificaremos o Usuário previamente, informando os motivos da suspensão ou encerramento.</p>

            <h4 style={subheadingStyle}>14.2. Pelo Usuário</h4>
            <p>
              Você pode encerrar sua conta a qualquer momento entrando em contato pelo e-mail{' '}
              <a href="mailto:suporte@precivox.com.br" style={linkStyle}>suporte@precivox.com.br</a> ou
              através das configurações da sua conta. Após o encerramento, seus dados serão tratados
              conforme nossa <Link href="/privacidade" style={linkStyle}>Política de Privacidade</Link>.
            </p>
          </Section>

          <Section title="15. Programa de Indicação (Referral)">
            <ul style={listStyle}>
              <li>O Usuário pode convidar amigos para a Plataforma por meio de códigos de indicação.</li>
              <li>Eventuais benefícios do programa serão descritos na Plataforma e podem ser alterados ou encerrados a qualquer momento.</li>
              <li>É proibido usar mecanismos artificiais para gerar indicações falsas. A PRECIVOX reserva-se o direito de cancelar indicações fraudulentas e suspender contas envolvidas.</li>
            </ul>
          </Section>

          <Section title="16. Modificações nos Termos">
            <p>
              A PRECIVOX poderá alterar estes Termos a qualquer momento. Em caso de alterações
              substanciais, notificaremos os Usuários por meio da Plataforma ou do e-mail cadastrado
              com <strong>antecedência mínima de 15 dias</strong> antes da entrada em vigor das novas
              condições.
            </p>
            <p>
              O uso continuado da Plataforma após a data de vigência das alterações constitui
              aceitação dos novos Termos. Caso não concorde com as modificações, você pode encerrar
              sua conta antes da entrada em vigor.
            </p>
          </Section>

          <Section title="17. Disposições Gerais">
            <ul style={listStyle}>
              <li><strong>Integralidade:</strong> Estes Termos, juntamente com a Política de Privacidade, constituem o acordo integral entre o Usuário e a PRECIVOX em relação ao uso da Plataforma.</li>
              <li><strong>Independência das cláusulas:</strong> Se qualquer disposição destes Termos for considerada inválida ou inexequível, as demais cláusulas permanecerão em pleno vigor e efeito.</li>
              <li><strong>Renúncia:</strong> A tolerância ou não exercício de qualquer direito previsto nestes Termos não constituirá renúncia ou novação.</li>
              <li><strong>Cessão:</strong> O Usuário não poderá ceder ou transferir seus direitos e obrigações sem consentimento prévio por escrito da PRECIVOX.</li>
            </ul>
          </Section>

          <Section title="18. Legislação Aplicável e Foro">
            <p>
              Estes Termos são regidos exclusivamente pelas leis da República Federativa do Brasil.
              Para dirimir quaisquer controvérsias, fica eleito o foro da <strong>Comarca do domicílio
              do Usuário</strong>, conforme assegurado pelo Art. 101, I, do Código de Defesa do Consumidor.
            </p>
          </Section>

          <Section title="19. Contato">
            <p>
              Em caso de dúvidas, reclamações ou sugestões sobre estes Termos, entre em contato:
            </p>
            <div style={contactBoxStyle}>
              <p><strong>E-mail geral:</strong> suporte@precivox.com.br</p>
              <p><strong>Proteção de dados (DPO):</strong> privacidade@precivox.com.br</p>
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
            <Link href="/privacidade" style={footerLinkStyle}>Privacidade</Link>
            <span style={footerSepStyle}>•</span>
            <a href="mailto:suporte@precivox.com.br" style={footerLinkStyle}>Contato</a>
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
