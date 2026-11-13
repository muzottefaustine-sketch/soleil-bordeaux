// Petit relais vers les serveurs Overpass (OpenStreetMap).
// L'appli l'appelle en premier : la réponse est gardée en mémoire par Vercel
// (1 h), donc la plupart des visiteurs n'attendent pas Overpass.
// Si ce fichier échoue, l'appli interroge directement les serveurs publics.
const ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const MAX_QUERY_LENGTH = 4000;
// Vercel (offre gratuite) coupe une fonction vers 10 s : on s'arrête avant.
const TOTAL_BUDGET_MS = 9000;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'GET uniquement' });
    return;
  }

  const query = String(req.query?.data || '');
  // Garde-fous : on ne relaie que des requêtes JSON de taille raisonnable.
  if (!query || query.length > MAX_QUERY_LENGTH || !query.startsWith('[out:json]')) {
    res.status(400).json({ error: 'Requête Overpass invalide' });
    return;
  }

  const started = Date.now();
  for (const [index, url] of ENDPOINTS.entries()) {
    const remaining = TOTAL_BUDGET_MS - (Date.now() - started);
    if (remaining < 1000) break;
    const budget = Math.floor(remaining / (ENDPOINTS.length - index));
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'User-Agent': 'SoleilEnTerrasse/1.0 (+https://soleil-bordeaux.vercel.app/)',
          'Referer': 'https://soleil-bordeaux.vercel.app/',
        },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(budget),
      });
      if (!response.ok) continue;
      const json = await response.json();
      if (!Array.isArray(json?.elements) || json.remark) continue;
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.status(200).json(json);
      return;
    } catch (e) {
      // serveur suivant
    }
  }
  res.status(502).json({ error: 'Overpass indisponible' });
};
