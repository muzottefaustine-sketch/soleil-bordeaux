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
});
if (!res.ok) throw new Error();
return await res.json();
} catch (e) {}
}
return { elements: [] };
}

module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Cache-Control’, ‘public, s-maxage=21600, stale-while-revalidate=43200’);
res.setHeader(‘Content-Type’, ‘application/json’);

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

res.json(terrasses);
};
