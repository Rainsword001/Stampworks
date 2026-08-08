// Email HTML has none of the CSS you'd normally reach for — no flexbox,
// no grid, unreliable custom fonts, and plenty of clients (Outlook
// especially) that strip <style> blocks entirely. Every element here is
// inline-styled and table-based on purpose; that's not old-fashioned,
// it's what actually survives being rendered by Gmail, Outlook, and
// Apple Mail at the same time.

const COPPER = '#C17A3D';
const PATINA = '#5C8A7A';
const INK = '#1F2421';
const PAPER = '#EDE8DC';
const PAPER_LINE = '#E3DDCC';
const TEXT_DIM = '#6B6A5E';

function button(text, url) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0;">
    <tr>
      <td style="border-radius:8px;background-color:${COPPER};">
        <a href="${url}" target="_blank"
           style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;
                  font-weight:bold;font-size:14px;color:#1F1712;text-decoration:none;letter-spacing:0.4px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

// Large spaced-out code in a dashed "stamped" box — echoes the app's own
// trade-stamp badge motif rather than a generic gray rectangle.
function codeBlock(code) {
  return `
  <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
    <tr>
      <td style="background-color:${PAPER};border:1px dashed ${COPPER};border-radius:10px;padding:18px 36px;text-align:center;">
        <span style="font-family:'Courier New',Courier,monospace;font-weight:bold;font-size:32px;
                     letter-spacing:10px;color:${INK};">${code}</span>
      </td>
    </tr>
  </table>`;
}

// A quoted message block — used for the customer's booking message.
function quoteBlock(text) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
    <tr>
      <td style="background-color:${PAPER};border-left:3px solid ${PATINA};border-radius:4px;padding:14px 18px;
                 font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${INK};font-style:italic;">
        "${text}"
      </td>
    </tr>
  </table>`;
}

// Small pill/badge — used for a status word like "Accepted".
function pill(text, color = PATINA) {
  return `<span style="display:inline-block;background-color:${color};color:#ffffff;font-family:Arial,Helvetica,sans-serif;
                 font-weight:bold;font-size:11px;letter-spacing:0.5px;text-transform:uppercase;
                 border-radius:999px;padding:5px 12px;">${text}</span>`;
}

module.exports = { COPPER, PATINA, INK, PAPER, PAPER_LINE, TEXT_DIM, button, codeBlock, quoteBlock, pill };
