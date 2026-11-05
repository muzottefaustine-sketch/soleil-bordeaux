// Petit relais vers les serveurs Overpass (OpenStreetMap).
// L'appli l'appelle en premier : la réponse est gardée en mémoire par Vercel
// (1 h), donc la plupart des visiteurs n'attendent pas Overpass.
// Si ce fichier échoue, l'appli interroge directement les serveurs publics.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
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
  for (const url of ENDPOINTS) {
    const remaining = TOTAL_BUDGET_MS - (Date.now() - started);
    if (remaining < 1000) break;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(remaining),
      });
      if (!response.ok) continue;
      const json = await response.json();
      if (!Array.isArray(json?.elements)) continue;
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.status(200).json(json);
      return;
    } catch (e) {
      // serveur suivant
    }
  }
  res.status(502).json({ error: 'Overpass indisponible' });
};
