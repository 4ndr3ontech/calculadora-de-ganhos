export const onRequestGet: PagesFunction = async () => {
  const endpoints = [
    "https://query1.finance.yahoo.com/v8/finance/chart/%5EBVSP?interval=1d&range=1d",
    "https://query2.finance.yahoo.com/v8/finance/chart/%5EBVSP?interval=1d&range=1d",
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CalculadoraDeGanhos/1.0)",
          "Accept": "application/json",
        },
        cf: { cacheTtl: 300, cacheEverything: true },
      });

      if (!res.ok) continue;

      const data: any = await res.json();
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;

      if (typeof price === "number" && price > 0) {
        return new Response(
          JSON.stringify({
            pts: Math.round(price),
            updatedAt: new Date().toISOString(),
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
    } catch {
      // Tenta o próximo endpoint
    }
  }

  return new Response(JSON.stringify({ error: "IBOV unavailable" }), {
    status: 502,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
