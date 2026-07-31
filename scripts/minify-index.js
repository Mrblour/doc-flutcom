import { minify } from 'html-minifier-terser';
import fs from 'fs';

async function minifyIndex() {
  const code = fs.readFileSync('index.html', 'utf-8');
  const result = await minify(code, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    minifyCSS: true,
    minifyJS: true,
  });
  fs.writeFileSync('index.html', result, 'utf-8');
  console.log('index.html minificado!');
}

minifyIndex();
