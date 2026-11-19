export const onRequestGet: PagesFunction = async () => {
  // 1. Tenta AwesomeAPI (Cotação Comercial BRL/USD)
  try {
    const res = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL", {
      headers: { "Accept": "application/json" },
      cf: { cacheTtl: 300, cacheEverything: true },
    });

    if (res.ok) {
      const data: any = await res.json();
      const usd = data?.USDBRL;
      const bid = parseFloat(usd?.bid);
      const ask = parseFloat(usd?.ask);

      if (!isNaN(bid) && bid > 0) {
        return new Response(
          JSON.stringify({
            bid,
            ask: !isNaN(ask) && ask > 0 ? ask : bid,
            high: parseFloat(usd?.high) || bid,
            low: parseFloat(usd?.low) || bid,
            pctChange: parseFloat(usd?.pctChange) || 0,
            createDate: usd?.create_date || new Date().toISOString(),
            source: "AwesomeAPI / BCB",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Cache-Control": "public, max-age=300",
            },
          }
        );
      }
    }
  } catch {}

  // 2. Fallback Yahoo Finance (BRL=X)
  try {
    const yRes = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/BRL=X?interval=1d&range=1d", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CalculadoraDeGanhos/1.0)",
        "Accept": "application/json",
      },
      cf: { cacheTtl: 300, cacheEverything: true },
    });

    if (yRes.ok) {
      const yData: any = await yRes.json();
      const price = yData?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (typeof price === "number" && price > 0) {
        return new Response(
          JSON.stringify({
            bid: price,
            ask: price,
            high: price,
            low: price,
            pctChange: 0,
            createDate: new Date().toISOString(),
            source: "Market Feed",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Cache-Control": "public, max-age=300",
            },
          }
        );
      }
    }
  } catch {}

  return new Response(JSON.stringify({ error: "USD quote unavailable" }), {
    status: 502,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
