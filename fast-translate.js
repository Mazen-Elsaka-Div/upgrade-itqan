const fs = require('fs');
const https = require('https');

async function translateChunk(texts) {
  return new Promise((resolve, reject) => {
    // Join texts with a unique separator
    const separator = '\n---SEP---\n';
    const query = encodeURIComponent(texts.join(separator));
    
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${query}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          let fullTranslation = '';
          if (json && json[0]) {
            json[0].forEach(item => {
              if (item[0]) fullTranslation += item[0];
            });
          }
          // Split back
          const translatedTexts = fullTranslation.split(/---\s*SEP\s*---/i).map(t => t.trim());
          resolve(translatedTexts);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const strings = JSON.parse(fs.readFileSync('extracted_arabic.json', 'utf8'));
  const translations = {};
  
  console.log(`Starting translation of ${strings.length} strings...`);
  
  // Chunk size
  const chunkSize = 20;
  
  for (let i = 0; i < strings.length; i += chunkSize) {
    const chunk = strings.slice(i, i + chunkSize);
    try {
      const translated = await translateChunk(chunk);
      for (let j = 0; j < chunk.length; j++) {
        translations[chunk[j]] = translated[j] || chunk[j];
      }
      console.log(`Translated ${i + chunk.length}/${strings.length}`);
    } catch (e) {
      console.error(`Error at chunk ${i}:`, e.message);
      // fallback
      for (let j = 0; j < chunk.length; j++) {
        translations[chunk[j]] = chunk[j];
      }
    }
    // wait a bit to avoid rate limits
    await new Promise(r => setTimeout(r, 1000));
  }
  
  fs.writeFileSync('translations_en.json', JSON.stringify(translations, null, 2));
  console.log('Done generating translations_en.json');
}

run();
