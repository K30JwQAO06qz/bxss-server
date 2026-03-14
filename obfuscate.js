const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');

const src = fs.readFileSync('public/payload.js', 'utf8')
  .replace('{{SERVER_URL}}', 'https://dmtanalytics.net');

const result = JavaScriptObfuscator.obfuscate(src, {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  selfDefending: false,
  transformObjectKeys: false,
  unicodeEscapeSequence: false
});

fs.writeFileSync('public/payload.min.js', result.getObfuscatedCode());
console.log('Done, size:', result.getObfuscatedCode().length, 'bytes');
