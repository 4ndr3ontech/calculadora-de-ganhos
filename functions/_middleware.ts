interface Env {}

const LUSOPHONE_COUNTRIES = new Set([
  "BR", // Brasil
  "PT", // Portugal
  "AO", // Angola
  "MZ", // Moçambique
  "CV", // Cabo Verde
  "GW", // Guiné-Bissau
  "ST", // São Tomé e Príncipe
  "TL", // Timor-Leste
]);

const BOT_REGEX = /bot|crawl|spider|slurp|googlebot|bingbot|yandex|duckduckbot|baiduspider|facebookexternalhit|twitterbot/i;

function getCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);

  // Só intercepta acessos à raiz "/"
  if (url.pathname !== "/") {
    return next();
  }

  // Não redireciona crawlers/robôs de SEO
  const userAgent = request.headers.get("User-Agent") || "";
  if (BOT_REGEX.test(userAgent)) {
    return next();
  }

  // Respeita escolha manual salva em cookie
  const langPref = getCookie(request.headers.get("Cookie"), "lang_pref");
  if (langPref === "pt-BR") {
    return next();
  }
  if (langPref === "en") {
    return Response.redirect(new URL("/en/", url.origin).toString(), 302);
  }

  // Detecta país pela rede da Cloudflare
  const country = ((request as any).cf?.country || "").toUpperCase();

  // Se vier de um país identificado e NÃO for lusófono, redireciona para /en/
  if (country && !LUSOPHONE_COUNTRIES.has(country)) {
    return Response.redirect(new URL("/en/", url.origin).toString(), 302);
  }

  return next();
};
