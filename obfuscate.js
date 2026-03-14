const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');

const src = fs.readFileSync('public/payload.js', 'utf8');
const result = JavaScriptObfuscator.obfuscate(src, {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.5,
  deadCodeInjection: false,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  selfDefending: true,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
});

fs.writeFileSync('public/payload.js', result.getObfuscatedCode());
console.log('Done, size:', result.getObfuscatedCode().length, 'bytes');
