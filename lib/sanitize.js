function sanitize(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function sanitizeJson(str) {
  if (!str) return '';
  try {
    const parsed = JSON.parse(str);
    return sanitize(JSON.stringify(parsed, null, 2));
  } catch (e) {
    return sanitize(str);
  }
}

module.exports = { sanitize, sanitizeJson };
