const { INK, COPPER, PAPER, PAPER_LINE, TEXT_DIM } = require('./components');

// Wraps any inner HTML in the branded Stampworks shell: dark header band
// with the stamp mark + wordmark (mirrors the app's own header and the
// presentation deck, so every touchpoint feels like the same product),
// a white content card, and a muted footer.
//
// Table-based on purpose — see components.js for why.
function emailLayout({ title = 'Stampworks', preheader = '', bodyHtml, footerNote }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};font-family:Arial,Helvetica,sans-serif;">
  <!-- Preheader: shows in inbox preview text, hidden in the email body itself -->
  <div style="display:none;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAPER};">
    <tr>
      <td align="center" style="padding:36px 16px;">

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:520px;background-color:#ffffff;border-radius:14px;overflow:hidden;
                      border:1px solid ${PAPER_LINE};">

          <!-- Header band -->
          <tr>
            <td style="background-color:${INK};padding:30px 32px;text-align:center;">
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr>
                <td style="width:46px;height:46px;border-radius:50%;border:2px solid ${COPPER};
                           text-align:center;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;
                           font-weight:bold;font-size:20px;color:#ECE7DB;line-height:42px;">S</td>
              </tr></table>
              <div style="margin-top:14px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;
                          font-size:20px;letter-spacing:4px;color:#ECE7DB;">STAMPWORKS</div>
              <div style="margin-top:5px;font-family:Arial,Helvetica,sans-serif;font-size:10.5px;
                          letter-spacing:2px;color:${COPPER};text-transform:uppercase;">Verified local trade</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;font-family:Arial,Helvetica,sans-serif;color:${INK};
                       font-size:15px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${PAPER};padding:20px 32px;text-align:center;border-top:1px solid ${PAPER_LINE};">
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${TEXT_DIM};">
                ${footerNote || "You're receiving this because you have a Stampworks account."}
              </div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${TEXT_DIM};margin-top:4px;">
                Stampworks — verified local trade, by the neighborhood.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = emailLayout;
