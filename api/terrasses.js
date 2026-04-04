// api/terrasses.js - Vercel Serverless Function
// Cache les données Overpass côté serveur pendant 6h

export const config = { runtime: ‘edge’ };

const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 heures
let cache = null;
let cacheTime = 0;

const ZONES = [
‘44.820,-0.630,44.870,-0.570’,
‘44.820,-0.570,44.870,-0.510’,
‘44.770,-0.630,44.820,-0.570’,
‘44.770,-0.570,44.820,-0.510’,
];

function buildQuery(bbox) {
return `[out:json][timeout:25];(node["amenity"~"bar|cafe|restaurant|pub|biergarten"](${bbox}););out body;`;
}

async function fetchZone(bbox) {
const endpoints = [
‘https://overpass-api.de/api/interpreter’,
‘https://overpass.kumi.systems/api/interpreter’,
];
for (const url of endpoints) {
try {
const res = await fetch(url, {
method: ‘POST’,
body: ‘data=’ + encodeURIComponent(buildQuery(bbox)),
signal: AbortSignal.timeout(12000),
});
if (!res.ok) throw new Error();
return await res.json();
} catch (e) {}
}
return { elements: [] };
}

export default async function handler(req) {
// CORS
const headers = {
‘Access-Control-Allow-Origin’: ‘*’,
‘Content-Type’: ‘application/json’,
‘Cache-Control’: ‘public, max-age=21600’,
};

// Retourner le cache si encore frais
if (cache && Date.now() - cacheTime < CACHE_DURATION) {
return new Response(JSON.stringify(cache), { headers });
}

// Charger toutes les zones
const results = await Promise.all(ZONES.map(bbox => fetchZone(bbox)));
const seen = new Set();
const terrasses = results
.flatMap(r => r?.elements || [])
.filter(el => {
if (!el.lat || !el.lon || !el.tags?.name) return false;
if (seen.has(el.tags.name)) return false;
seen.add(el.tags.name);
return true;
})
.map(el => ({
id: el.id,
nom: el.tags.name,
adresse: el.tags[‘addr:street’]
? ((el.tags[‘addr:housenumber’] || ‘’) + ’ ’ + el.tags[‘addr:street’]).trim()
: ‘’,
type: { bar: ‘Bar’, cafe: ‘Café’, restaurant: ‘Restaurant’, pub: ‘Pub’, biergarten: ‘Brasserie’ }[el.tags.amenity] || ‘Terrasse’,
lng: el.lon,
lat: el.lat,
}));

cache = terrasses;
cacheTime = Date.now();

return new Response(JSON.stringify(terrasses), { headers });
}
