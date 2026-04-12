/**
 * FootMatch — Script de peuplement des complexes de Five en France
 * Source : OpenStreetMap via Overpass API (100% gratuit)
 *
 * Usage :
 *   1. Remplace SUPABASE_URL et SUPABASE_SERVICE_KEY ci-dessous
 *   2. node scripts/seed-venues.js
 */

const SUPABASE_URL         = 'COLLE_TON_SUPABASE_URL_ICI';
const SUPABASE_SERVICE_KEY = 'COLLE_TON_SERVICE_ROLE_KEY_ICI'; // Settings > API > service_role

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// Bounding box France métropolitaine
const BBOX = '41.3,-5.2,51.1,9.6';

// Mots-clés qui identifient un complexe de Five
const FIVE_PATTERN = '[Ff]ive|[Ff]oot.?5|[Uu]rban.?[Ss]occer|[Cc]ité.?[Ff]oot|[Ff]utsal|[Ss]occer.?[Pp]ark|[Ii]ndoor.?[Ff]oot|[Mm]ulti.?[Ss]ports';

const query = `
[out:json][timeout:120];
(
  node["name"~"${FIVE_PATTERN}"](${BBOX});
  way["name"~"${FIVE_PATTERN}"](${BBOX});
  node["leisure"="sports_centre"]["sport"~"soccer|football"](${BBOX});
  way["leisure"="sports_centre"]["sport"~"football"](${BBOX});
);
out center;
`;

async function fetchFromOverpass() {
  console.log('🌍 Interrogation de OpenStreetMap (Overpass API)...');
  const res = await fetch(OVERPASS_URL, {
    method:  'POST',
    body:    `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
  const json = await res.json();
  console.log(`✅ ${json.elements.length} éléments trouvés sur OSM`);
  return json.elements;
}

function normalizeVenue(el) {
  const tags = el.tags || {};
  const lat  = el.lat ?? el.center?.lat;
  const lon  = el.lon ?? el.center?.lon;
  if (!lat || !lon || !tags.name) return null;

  const address = [
    tags['addr:housenumber'],
    tags['addr:street'],
  ].filter(Boolean).join(' ') || tags['addr:full'] || null;

  const city = tags['addr:city'] || tags['addr:town'] || tags['addr:village'] || null;

  // Déduire les types de terrain
  const types = [];
  const nameLower = (tags.name || '').toLowerCase();
  if (nameLower.includes('five') || nameLower.includes('foot 5') || nameLower.includes('foot5')) types.push('five');
  if (nameLower.includes('city') || nameLower.includes('seven') || nameLower.includes('7')) types.push('city');
  if (tags['sport'] === 'football' || nameLower.includes('foot à 11') || nameLower.includes('foot 11')) types.push('eleven');
  if (types.length === 0) types.push('five', 'city');

  return {
    name:        tags.name,
    address:     address,
    city:        city,
    latitude:    lat,
    longitude:   lon,
    types:       types,
    description: tags['description'] || null,
    status:      'approved',
    source:      'osm',
    osm_id:      String(el.id),
  };
}

async function insertToSupabase(venues) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let inserted = 0;
  let skipped  = 0;

  // Insertion par lots de 50
  for (let i = 0; i < venues.length; i += 50) {
    const batch = venues.slice(i, i + 50);
    const { data, error } = await supabase
      .from('venues')
      .upsert(batch, { onConflict: 'osm_id', ignoreDuplicates: true });

    if (error) {
      console.error(`❌ Erreur lot ${Math.floor(i/50)+1}:`, error.message);
      skipped += batch.length;
    } else {
      inserted += batch.length;
      console.log(`   Lot ${Math.floor(i/50)+1}/${Math.ceil(venues.length/50)} inséré (${i + batch.length}/${venues.length})`);
    }
  }

  return { inserted, skipped };
}

async function main() {
  console.log('⚽ FootMatch — Seeding des complexes de Five en France\n');

  try {
    const elements = await fetchFromOverpass();
    const venues   = elements.map(normalizeVenue).filter(Boolean);

    console.log(`\n📍 ${venues.length} complexes valides à insérer`);
    console.log('   Répartition :');

    const byCity = {};
    venues.forEach(v => { if (v.city) byCity[v.city] = (byCity[v.city] || 0) + 1; });
    Object.entries(byCity)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 15)
      .forEach(([city, count]) => console.log(`   ${city}: ${count}`));

    console.log('\n💾 Insertion dans Supabase...');
    const { inserted, skipped } = await insertToSupabase(venues);

    console.log(`\n✅ Terminé !`);
    console.log(`   Insérés : ${inserted}`);
    console.log(`   Ignorés : ${skipped} (déjà existants ou erreur)`);

  } catch (err) {
    console.error('❌ Erreur fatale :', err.message);
    process.exit(1);
  }
}

main();
