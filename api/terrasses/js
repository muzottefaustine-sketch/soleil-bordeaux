const ZONES = [
‘44.820,-0.630,44.870,-0.570’,
‘44.820,-0.570,44.870,-0.510’,
‘44.770,-0.630,44.820,-0.570’,
‘44.770,-0.570,44.820,-0.510’,
];

function buildQuery(bbox) {
return `[out:json][timeout:25];(node["amenity"~"bar|cafe|restaurant|pub|biergarten"](${bbox}););out body;`;
}

async function fetchFromOverpass() {
const endpoints = [
‘https://overpass-api.de/api/interpreter’,
‘https://overpass.kumi.systems/api/interpreter’,
];

for (const url of endpoints) {
try {
const results = await Promise.all(ZONES.map(async bbox => {
const res = await fetch(url, {
method: ‘POST’,
body: ‘data=’ + encodeURIComponent(buildQuery(bbox)),
signal: AbortSignal.timeout(8000),
});
if (!res.ok) throw new Error();
return await res.json();
}));

```
  const seen = new Set();
  return results
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
      adresse: el.tags['addr:street']
        ? ((el.tags['addr:housenumber'] || '') + ' ' + el.tags['addr:street']).trim()
        : '',
      type: { bar: 'Bar', cafe: 'Café', restaurant: 'Restaurant', pub: 'Pub', biergarten: 'Brasserie' }[el.tags.amenity] || 'Terrasse',
      lng: el.lon,
      lat: el.lat,
    }));
} catch (e) {}
```

}
return null;
}

async function saveToGitHub(data) {
const token = process.env.GITHUB_TOKEN;
if (!token) return false;

try {
// Récupère le SHA actuel du fichier
const getRes = await fetch(‘https://api.github.com/repos/muzottefaustine-sketch/soleil-bordeaux/contents/data/terrasses.json’, {
headers: { ‘Authorization’: `Bearer ${token}`, ‘Accept’: ‘application/vnd.github.v3+json’ }
});

```
const content = Buffer.from(JSON.stringify(data)).toString('base64');
const body = {
  message: 'Update terrasses data',
  content,
  ...(getRes.ok ? { sha: (await getRes.json()).sha } : {})
};

const putRes = await fetch('https://api.github.com/repos/muzottefaustine-sketch/soleil-bordeaux/contents/data/terrasses.json', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

return putRes.ok;
```

} catch (e) {
return false;
}
}

async function loadFromGitHub() {
try {
const res = await fetch(‘https://raw.githubusercontent.com/muzottefaustine-sketch/soleil-bordeaux/main/data/terrasses.json’);
if (!res.ok) return null;
return await res.json();
} catch (e) {
return null;
}
}

module.exports = async function handler(req, res) {
res.setHeader(‘Access-Control-Allow-Origin’, ‘*’);
res.setHeader(‘Content-Type’, ‘application/json’);

// 1. Essaie de charger depuis GitHub (cache)
const cached = await loadFromGitHub();
if (cached && cached.length > 0) {
res.setHeader(‘Cache-Control’, ‘public, s-maxage=3600’);
res.json(cached);

```
// Rafraîchit en arrière-plan si le fichier existe déjà
fetchFromOverpass().then(data => {
  if (data && data.length > 0) saveToGitHub(data);
});
return;
```

}

// 2. Si pas de cache, fetche Overpass
const data = await fetchFromOverpass();
if (data && data.length > 0) {
await saveToGitHub(data);
res.setHeader(‘Cache-Control’, ‘public, s-maxage=3600’);
res.json(data);
} else {
res.status(500).json({ error: ‘Overpass unavailable’ });
}
};
