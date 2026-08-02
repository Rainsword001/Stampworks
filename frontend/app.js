const API_BASE = '/api'; // same-origin: Express serves this file and the API together

const TRADES = ["Plumbing","Electrical","Carpentry","Masonry","Painting","Welding","Roofing","Landscaping"];

const STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara',
];

let state = {
  tab: 'browse',
  artisans: [],
  search: '',
  tradeFilter: 'All',
  stateFilter: 'All',
  cityFilter: '',
  sort: 'rating',
  modal: null,        // { type: 'profile', id } | { type: 'login' } | { type: 'signup' } | { type: 'forgot' } | { type: 'reset', token }
  profileArtisan: null,
  profileReviews: [],
  bookings: [],
  receivedBookings: [],
  myListing: null,
  loaded: false,
  authError: '',
  authMessage: '',
  ratingDrafts: {}, // { [bookingId]: { rating, comment } } — in-progress review inputs
  notice: null,      // { type: 'success'|'error', title, message } — response modal, independent of state.modal
};

function getToken(){ return localStorage.getItem('sw_token'); }
function getUser(){ try{ return JSON.parse(localStorage.getItem('sw_user')); }catch(e){ return null; } }
function setSession(token, user){ localStorage.setItem('sw_token', token); localStorage.setItem('sw_user', JSON.stringify(user)); }
function clearSession(){ localStorage.removeItem('sw_token'); localStorage.removeItem('sw_user'); }

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data; // preserve extra fields the backend sent (e.g. needsVerification, email)
    throw err;
  }
  return data;
}

function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function gaugeSvg(rating){
  const r = rating || 0;
  const pct = Math.max(0, Math.min(1, r/5));
  const cx=24, cy=24, rad=20;
  const startAngle = 180, endAngle = 180 + 180*pct;
  const toXY = (deg)=>{ const rd=(deg*Math.PI)/180; return [cx+rad*Math.cos(rd), cy+rad*Math.sin(rd)]; };
  const [sx,sy] = toXY(startAngle);
  const [ex,ey] = toXY(endAngle);
  const largeArc = (endAngle-startAngle) > 180 ? 1 : 0;
  const path = `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${rad} ${rad} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
  const color = r >= 4.6 ? '#5C8A7A' : r >= 4.0 ? '#C17A3D' : '#B5533C';
  return `<svg width="48" height="30" viewBox="0 0 48 30">
    <path d="M 4 24 A 20 20 0 1 1 44 24" fill="none" stroke="rgba(31,36,33,0.15)" stroke-width="4" stroke-linecap="round"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    <text x="24" y="22" text-anchor="middle" font-family="JetBrains Mono" font-weight="700" font-size="10" fill="#1F2421">${r.toFixed(1)}</text>
  </svg>`;
}

function stampSvg(initial){
  return `<svg width="34" height="34" viewBox="0 0 34 34">
    <circle cx="17" cy="17" r="15.5" fill="none" stroke="#C17A3D" stroke-width="1.6"/>
    <circle cx="17" cy="17" r="11.5" fill="none" stroke="#5C8A7A" stroke-width="1" stroke-dasharray="1.5 2.2"/>
    <text x="17" y="21.5" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="12" fill="#1F2421">${initial}</text>
  </svg>`;
}

/* ---------- Data loading ---------- */

async function loadArtisans(){
  const params = new URLSearchParams();
  if (state.tradeFilter !== 'All') params.set('trade', state.tradeFilter);
  if (state.stateFilter !== 'All') params.set('state', state.stateFilter);
  if (state.cityFilter.trim()) params.set('city', state.cityFilter.trim());
  if (state.search.trim()) params.set('search', state.search.trim());
  if (state.sort) params.set('sort', state.sort);
  const res = await api('/artisans?' + params.toString());
  state.artisans = res.data;
}

async function loadMyBookings(){
  if (!getUser()) { state.bookings = []; return; }
  const res = await api('/bookings/mine');
  state.bookings = res.data;
}

async function loadReceivedBookings(){
  const user = getUser();
  if (!user || user.role !== 'artisan') { state.receivedBookings = []; return; }
  try {
    const res = await api('/bookings/received');
    state.receivedBookings = res.data;
  } catch(e) {
    state.receivedBookings = []; // no listing yet
  }
}

/* ---------- Rendering ---------- */

function render(){
  renderAuthArea();
  const app = document.getElementById('app');
  if (!state.loaded){ app.innerHTML = '<div class="loading">Loading the ledger…</div>'; return; }

  if (state.tab === 'browse') app.innerHTML = renderBrowse();
  else if (state.tab === 'list') app.innerHTML = renderListForm();
  else if (state.tab === 'bookings') app.innerHTML = renderBookings();

  attachTabHandlers();
  renderModal();
  renderNotice();
}

function showNotice(type, title, message){
  state.notice = { type, title, message };
  render();
}

function renderNotice(){
  const root = document.getElementById('noticeRoot');
  if (!state.notice){ root.innerHTML = ''; return; }
  const { type, title, message } = state.notice;
  root.innerHTML = `
    <div class="overlay" id="noticeOverlay">
      <div class="modal notice-modal">
        <div class="notice-icon ${type}">${type === 'success' ? '✓' : '!'}</div>
        <h2 style="text-align:center;">${escapeHtml(title)}</h2>
        <p class="notice-message">${escapeHtml(message)}</p>
        <button class="btn ${type === 'error' ? 'secondary' : ''}" id="noticeOk">OK</button>
      </div>
    </div>`;
  document.getElementById('noticeOverlay').onclick = (e) => { if (e.target.id === 'noticeOverlay') closeNotice(); };
  document.getElementById('noticeOk').onclick = closeNotice;
}

function closeNotice(){ state.notice = null; renderNotice(); }

function renderAuthArea(){
  const user = getUser();
  const el = document.getElementById('authArea');
  if (user) {
    el.innerHTML = `<span class="who">Signed in as <b>${escapeHtml(user.name)}</b> (${user.role})</span><button class="link-btn" id="logoutBtn">Log out</button>`;
    document.getElementById('logoutBtn').onclick = () => { clearSession(); state.tab='browse'; init(); };
  } else {
    el.innerHTML = `<button class="pill-btn" id="loginBtn">Log in / Sign up</button>`;
    document.getElementById('loginBtn').onclick = () => { state.modal = { type:'login' }; render(); };
  }
}

function renderBrowse(){
  const list = state.artisans;
  return `
    <div class="searchbar">
      <input id="searchInput" type="text" placeholder="Search by name, area, or trade…" value="${escapeHtml(state.search)}"/>
      <select id="stateSelect">
        <option value="All" ${state.stateFilter==='All'?'selected':''}>All states</option>
        ${STATES.map(s=>`<option value="${s}" ${state.stateFilter===s?'selected':''}>${s}</option>`).join('')}
      </select>
      <input id="cityInput" type="text" placeholder="City…" value="${escapeHtml(state.cityFilter)}" style="max-width:140px;"/>
      <select id="sortSelect">
        <option value="rating" ${state.sort==='rating'?'selected':''}>Sort: Top rated</option>
        <option value="exp" ${state.sort==='exp'?'selected':''}>Sort: Most experienced</option>
        <option value="newest" ${state.sort==='newest'?'selected':''}>Sort: Newest listed</option>
      </select>
    </div>
    <div class="chips">
      <div class="chip ${state.tradeFilter==='All'?'active':''}" data-trade="All">All trades</div>
      ${TRADES.map(t=>`<div class="chip ${state.tradeFilter===t?'active':''}" data-trade="${t}">${t}</div>`).join('')}
    </div>
    <div class="count-row"><span>${list.length} tradespeople found</span><span>${state.cityFilter ? escapeHtml(state.cityFilter)+', ' : ''}${state.stateFilter!=='All' ? escapeHtml(state.stateFilter) : 'All of Nigeria'}</span></div>
    ${list.length===0 ? `<div class="empty"><h3>No matches yet</h3><p>Try a different trade, state, city, or search term.</p></div>` : `
    <div class="grid">
      ${list.map(a=>`
        <div class="card" data-id="${a.id}">
          <div class="card-top">
            <div>
              <div class="card-name">${escapeHtml(a.name)}</div>
              <div class="card-trade">${a.trade}</div>
              <div class="card-loc">${escapeHtml(a.area)}, ${escapeHtml(a.city)}, ${escapeHtml(a.state)}</div>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
              ${a.verified ? stampSvg(a.name.charAt(0)) : ''}
              ${gaugeSvg(a.ratingAvg)}
            </div>
          </div>
          <div class="card-bottom">
            <div class="price">${escapeHtml(a.priceRange)}</div>
            <div class="exp">${a.yearsExp} yrs · ${a.reviewCount||0} reviews</div>
          </div>
        </div>
      `).join('')}
    </div>`}
  `;
}

function renderListForm(){
  const user = getUser();
  if (!user) {
    return `<div class="gate-note"><b>Log in first.</b><br>Create an account (choose "I'm a tradesperson" when signing up) to list your services.</div>`;
  }
  if (user.role !== 'artisan') {
    return `<div class="gate-note">Your account is registered as a <b>customer</b>. Only artisan accounts can create a listing — sign up again with the tradesperson option to list your services.</div>`;
  }
  return `
    <div class="form-panel">
      <h2>List your trade</h2>
      <p style="color:var(--paper-text);font-size:13.5px;margin-top:-6px;">Get discovered by people nearby looking for your skill.</p>
      <div class="two-col">
        <div class="field"><label>Trade</label>
          <select id="f-trade">${TRADES.map(t=>`<option value="${t}">${t}</option>`).join('')}<option value="Other">Other (specify)</option></select>
        </div>
        <div class="field"><label>Years of experience</label><input id="f-exp" type="number" min="0" placeholder="e.g. 5"/></div>
      </div>
      <div class="field" id="tradeOtherField" style="display:none;"><label>Your trade</label><input id="f-trade-other" type="text" placeholder="e.g. Dog Grooming, Tiling, AC Repair…"/></div>
      <div class="two-col">
        <div class="field"><label>State</label>
          <select id="f-state">${STATES.map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
        </div>
        <div class="field"><label>City</label><input id="f-city" type="text" placeholder="e.g. Port Harcourt"/></div>
      </div>
      <div class="field"><label>Area / neighborhood</label><input id="f-area" type="text" placeholder="e.g. Woji"/></div>
      <div class="field"><label>Price range</label><input id="f-price" type="text" placeholder="e.g. ₦5,000–20,000"/></div>
      <div class="field"><label>Phone (only shown after someone books you)</label><input id="f-phone" type="text" placeholder="e.g. +234 800 000 0000"/></div>
      <div class="field"><label>Short bio</label><textarea id="f-bio" rows="3" placeholder="What you do, specialties, availability…"></textarea></div>
      <button class="btn" id="submitListing">Save listing</button>
    </div>
  `;
}

function statusClass(s){ return 'status-' + s; }

function starPicker(bookingId, currentRating){
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += `<span class="star-pick ${i <= currentRating ? 'filled' : ''}" data-star="${i}" data-booking-id="${bookingId}">★</span>`;
  }
  return `<div class="star-row">${stars}</div>`;
}

function renderBookings(){
  const user = getUser();
  if (!user) return `<div class="gate-note"><b>Log in first.</b><br>Your sent and received bookings will show up here.</div>`;

  const sentSection = `
    <h2 style="font-family:Oswald;text-transform:uppercase;letter-spacing:.03em;font-size:16px;margin-top:0;">Sent by you</h2>
    ${state.bookings.length===0 ? `<div class="empty" style="padding:24px;"><p>No bookings sent yet.</p></div>` : `
    <div class="req-list">
      ${state.bookings.map(b=>{
        const draft = state.ratingDrafts[b.id] || { rating: 0, comment: '' };
        return `
        <div class="req-card">
          <div class="rname"><span>${escapeHtml(b.Artisan?.name || 'Artisan')}</span><span class="status-tag ${statusClass(b.status)}">${b.status}</span></div>
          <div class="rtrade">${b.Artisan?.trade || ''} · ${b.Artisan?.area || ''}</div>
          <div class="rmsg">${escapeHtml(b.message)}</div>
          <div class="rmeta">Sent ${new Date(b.createdAt).toLocaleString()}${b.preferredDate ? ` · Preferred: ${b.preferredDate}` : ''}</div>
          ${b.status === 'completed' ? (
            b.Review ? `
              <div class="review-done">
                <div class="star-row static">${'★'.repeat(b.Review.rating)}${'☆'.repeat(5 - b.Review.rating)}</div>
                ${b.Review.comment ? `<div class="rmsg">${escapeHtml(b.Review.comment)}</div>` : ''}
                <div class="rmeta">You rated this job</div>
              </div>
            ` : `
              <div class="rate-box">
                <label class="field-label" style="margin-top:2px;">Rate this job</label>
                ${starPicker(b.id, draft.rating)}
                <textarea data-comment-for="${b.id}" rows="2" placeholder="Optional comment">${escapeHtml(draft.comment)}</textarea>
                <button class="btn secondary" data-submit-review="${b.id}" ${draft.rating === 0 ? 'disabled' : ''}>Submit rating</button>
                <div class="form-msg" data-review-msg="${b.id}"></div>
              </div>
            `
          ) : ''}
        </div>
      `;}).join('')}
    </div>`}
  `;

  let receivedSection = '';
  if (user.role === 'artisan') {
    receivedSection = `
      <h2 style="font-family:Oswald;text-transform:uppercase;letter-spacing:.03em;font-size:16px;margin-top:28px;">Received by you</h2>
      ${state.receivedBookings.length===0 ? `<div class="empty" style="padding:24px;"><p>No booking requests yet.</p></div>` : `
      <div class="req-list">
        ${state.receivedBookings.map(b=>`
          <div class="req-card">
            <div class="rname"><span>${escapeHtml(b.customer?.name || 'Customer')}</span><span class="status-tag ${statusClass(b.status)}">${b.status}</span></div>
            <div class="rmsg">${escapeHtml(b.message)}</div>
            <div class="rmeta">Received ${new Date(b.createdAt).toLocaleString()}${b.preferredDate ? ` · Preferred: ${b.preferredDate}` : ''}</div>
            ${b.status==='pending' ? `
            <div class="action-row">
              <button data-booking-action="accepted" data-booking-id="${b.id}">Accept</button>
              <button data-booking-action="declined" data-booking-id="${b.id}">Decline</button>
            </div>` : ''}
            ${b.status==='accepted' ? `
            <div class="action-row">
              <button data-booking-action="completed" data-booking-id="${b.id}">Mark completed</button>
            </div>` : ''}
          </div>
        `).join('')}
      </div>`}
    `;
  }

  return sentSection + receivedSection;
}

/* ---------- Modals ---------- */

function renderModal(){
  const root = document.getElementById('modalRoot');
  if (!state.modal){ root.innerHTML = ''; return; }

  if (state.modal.type === 'login' || state.modal.type === 'signup') {
    root.innerHTML = renderAuthModal(state.modal.type);
    attachAuthModalHandlers(state.modal.type);
    return;
  }
  if (state.modal.type === 'forgot') {
    root.innerHTML = renderForgotModal();
    attachForgotModalHandlers();
    return;
  }
  if (state.modal.type === 'reset') {
    root.innerHTML = renderResetModal();
    attachResetModalHandlers();
    return;
  }
  if (state.modal.type === 'verify') {
    root.innerHTML = renderVerifyModal();
    attachVerifyModalHandlers();
    return;
  }
  if (state.modal.type === 'profile') {
    if (!state.profileArtisan) { root.innerHTML = ''; return; }
    root.innerHTML = renderProfileModal(state.profileArtisan);
    attachProfileModalHandlers();
  }
}

function renderAuthModal(mode){
  const isLogin = mode === 'login';
  return `
  <div class="overlay" id="overlay">
    <div class="modal">
      <button class="modal-close" id="closeModal">✕</button>
      <h2>${isLogin ? 'Log in' : 'Create your account'}</h2>
      ${isLogin ? `
        <label class="field-label">Email</label>
        <input id="auth-email" type="email" placeholder="you@example.com"/>
        <label class="field-label">Password</label>
        <input id="auth-password" type="password" placeholder="••••••••"/>
        <div style="text-align:right;margin-top:6px;"><span class="link-btn" id="forgotLink" style="display:inline;">Forgot password?</span></div>
      ` : `
        <label class="field-label">Full name</label>
        <input id="auth-name" type="text" placeholder="e.g. Uche Eze"/>
        <label class="field-label">Email</label>
        <input id="auth-email" type="email" placeholder="you@example.com"/>
        <label class="field-label">Phone</label>
        <input id="auth-phone" type="text" placeholder="+234 800 000 0000"/>
        <label class="field-label">Password</label>
        <input id="auth-password" type="password" placeholder="At least 8 characters"/>
        <label class="field-label">I am a…</label>
        <select id="auth-role">
          <option value="customer">Customer, looking to hire</option>
          <option value="artisan">Tradesperson, offering services</option>
        </select>
      `}
      <button class="btn" id="authSubmit">${isLogin ? 'Log in' : 'Sign up'}</button>
      ${state.authError ? `<div class="error-note">${escapeHtml(state.authError)}</div>` : ''}
      <div class="modal-switch">
        ${isLogin ? `New here? <span class="link-btn" id="switchAuth" style="display:inline;">Create an account</span>`
                   : `Already have an account? <span class="link-btn" id="switchAuth" style="display:inline;">Log in</span>`}
      </div>
      ${isLogin ? `<p style="font-family:'JetBrains Mono';font-size:11px;color:var(--paper-text);margin-top:14px;">Demo login: customer@demo.com / password123</p>` : ''}
    </div>
  </div>`;
}

function renderForgotModal(){
  return `
  <div class="overlay" id="overlay">
    <div class="modal">
      <button class="modal-close" id="closeModal">✕</button>
      <h2>Reset your password</h2>
      <p style="color:var(--paper-text);font-size:13.5px;">Enter the email on your account and we'll send a reset link.</p>
      <label class="field-label">Email</label>
      <input id="forgot-email" type="email" placeholder="you@example.com"/>
      <button class="btn" id="forgotSubmit">Send reset link</button>
      ${state.authError ? `<div class="error-note">${escapeHtml(state.authError)}</div>` : ''}
      ${state.authMessage ? `<div class="sent-note">${escapeHtml(state.authMessage)}</div>` : ''}
      <div class="modal-switch"><span class="link-btn" id="backToLogin" style="display:inline;">Back to log in</span></div>
    </div>
  </div>`;
}

function renderResetModal(){
  const prefillToken = state.modal.token || '';
  return `
  <div class="overlay" id="overlay">
    <div class="modal">
      <button class="modal-close" id="closeModal">✕</button>
      <h2>Set a new password</h2>
      ${!prefillToken ? `
        <label class="field-label">Reset token</label>
        <input id="reset-token" type="text" placeholder="Paste the token from your reset link"/>
      ` : `<input id="reset-token" type="hidden" value="${escapeHtml(prefillToken)}"/>`}
      <label class="field-label">New password</label>
      <input id="reset-password" type="password" placeholder="At least 8 characters"/>
      <button class="btn" id="resetSubmit">Update password</button>
      ${state.authError ? `<div class="error-note">${escapeHtml(state.authError)}</div>` : ''}
      ${state.authMessage ? `<div class="sent-note">${escapeHtml(state.authMessage)}</div>` : ''}
    </div>
  </div>`;
}

function renderVerifyModal(){
  const email = state.modal.email || '';
  return `
  <div class="overlay" id="overlay">
    <div class="modal">
      <button class="modal-close" id="closeModal">✕</button>
      <h2>Verify your email</h2>
      <p style="color:var(--paper-text);font-size:13.5px;">We sent a 6-digit code to <b>${escapeHtml(email)}</b>. Enter it below.</p>
      <input id="verify-email" type="hidden" value="${escapeHtml(email)}"/>
      <label class="field-label">Verification code</label>
      <input id="verify-otp" type="text" inputmode="numeric" maxlength="6" placeholder="123456" style="letter-spacing:6px;font-size:20px;text-align:center;"/>
      <button class="btn" id="verifySubmit">Verify</button>
      ${state.authError ? `<div class="error-note">${escapeHtml(state.authError)}</div>` : ''}
      ${state.authMessage ? `<div class="sent-note">${escapeHtml(state.authMessage)}</div>` : ''}
      <div class="modal-switch"><span class="link-btn" id="resendOtpLink" style="display:inline;">Resend code</span></div>
    </div>
  </div>`;
}

function renderProfileModal(a){
  const user = getUser();
  return `
  <div class="overlay" id="overlay">
    <div class="modal">
      <button class="modal-close" id="closeModal">✕</button>
      <div style="display:flex;gap:10px;align-items:center;">
        ${a.verified ? stampSvg(a.name.charAt(0)) : ''}
        <div>
          <h2>${escapeHtml(a.name)}</h2>
          <div class="modal-trade">${a.trade} · ${escapeHtml(a.area)}, ${escapeHtml(a.city)}, ${escapeHtml(a.state)}</div>
        </div>
      </div>
      <p class="modal-bio">${escapeHtml(a.bio)}</p>
      <div class="stat-row">
        <div class="stat">RATING<b>${(a.ratingAvg||0).toFixed(1)} ★ (${a.reviewCount||0})</b></div>
        <div class="stat">EXPERIENCE<b>${a.yearsExp} yrs</b></div>
        <div class="stat">TYPICAL PRICE<b>${escapeHtml(a.priceRange)}</b></div>
      </div>
      ${a.phone ? `
        <div class="contact-box unlocked">
          <div>📞 ${escapeHtml(a.phone)}</div>
          <div class="sent-note">You've booked this artisan — they'll reach out directly.</div>
        </div>
      ` : !user ? `
        <div class="contact-box locked">Log in to book this artisan and unlock contact details.</div>
        <button class="btn secondary" id="loginFromModal">Log in / Sign up</button>
      ` : `
        <div class="contact-box locked">Contact details unlock once you send a booking.</div>
        <label class="field-label">What do you need done?</label>
        <textarea id="bookMessage" rows="3" placeholder="e.g. Kitchen sink leaking, need a fix this week."></textarea>
        <label class="field-label">Preferred date (optional)</label>
        <input id="bookDate" type="date"/>
        <button class="btn secondary" id="sendBooking">Send booking request</button>
      `}
      ${state.profileReviews.length > 0 ? `
        <div class="reviews-block">
          <label class="field-label">Recent reviews</label>
          ${state.profileReviews.slice(0, 5).map(r => `
            <div class="review-item">
              <div class="star-row static small">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
              ${r.comment ? `<div class="rmsg">${escapeHtml(r.comment)}</div>` : ''}
              <div class="rmeta">${escapeHtml(r.customer?.name || 'Customer')} · ${new Date(r.createdAt).toLocaleDateString()}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  </div>`;
}

/* ---------- List Your Trade ---------- */

async function submitListing(){
  const tradeSelect = document.getElementById('f-trade').value;
  const tradeOtherEl = document.getElementById('f-trade-other');
  const trade = tradeSelect === 'Other' ? (tradeOtherEl ? tradeOtherEl.value.trim() : '') : tradeSelect;
  const stateVal = document.getElementById('f-state').value;
  const city = document.getElementById('f-city').value.trim();
  const area = document.getElementById('f-area').value.trim();
  const yearsExp = document.getElementById('f-exp').value;
  const priceRange = document.getElementById('f-price').value.trim();
  const phone = document.getElementById('f-phone').value.trim();
  const bio = document.getElementById('f-bio').value.trim();

  if (!trade) {
    showNotice('error', 'Missing trade', tradeSelect === 'Other' ? 'Please type your trade in the box provided.' : 'Please select a trade.');
    return;
  }
  if (!city || !area || !priceRange || !phone || !bio || yearsExp === '') {
    showNotice('error', 'Missing information', 'Please fill in every field.');
    return;
  }

  try {
    await api('/artisans/me', {
      method: 'POST',
      body: JSON.stringify({ trade, state: stateVal, city, area, bio, yearsExp: Number(yearsExp), priceRange, phone }),
    });
    await loadArtisans();
    showNotice('success', 'Listing saved', 'Your listing is live — check the Browse tab to see it.');
  } catch (e) {
    showNotice('error', 'Could not save listing', e.message);
  }
}

/* ---------- Event wiring ---------- */

function attachTabHandlers(){
  document.querySelectorAll('#mainNav button').forEach(b=>{
    b.onclick = async () => {
      state.tab = b.dataset.tab;
      document.querySelectorAll('#mainNav button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      if (state.tab === 'bookings') { await loadMyBookings(); await loadReceivedBookings(); }
      render();
    };
  });

  if (state.tab === 'browse') {
    const search = document.getElementById('searchInput');
    if (search) search.oninput = debounce(async (e) => {
      state.search = e.target.value;
      await loadArtisans();
      render();
      const s = document.getElementById('searchInput');
      if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
    }, 300);

    const sortSel = document.getElementById('sortSelect');
    if (sortSel) sortSel.onchange = async (e) => { state.sort = e.target.value; await loadArtisans(); render(); };

    const stateSel = document.getElementById('stateSelect');
    if (stateSel) stateSel.onchange = async (e) => { state.stateFilter = e.target.value; await loadArtisans(); render(); };

    const cityInp = document.getElementById('cityInput');
    if (cityInp) cityInp.oninput = debounce(async (e) => {
      state.cityFilter = e.target.value;
      await loadArtisans();
      render();
      const c = document.getElementById('cityInput');
      if (c) { c.focus(); c.setSelectionRange(c.value.length, c.value.length); }
    }, 300);

    document.querySelectorAll('.chip').forEach(c=>{
      c.onclick = async () => { state.tradeFilter = c.dataset.trade; await loadArtisans(); render(); };
    });

    document.querySelectorAll('.card').forEach(c=>{
      c.onclick = () => openProfile(c.dataset.id);
    });
  }

  if (state.tab === 'list') {
    const btn = document.getElementById('submitListing');
    if (btn) btn.onclick = submitListing;

    const tradeSel = document.getElementById('f-trade');
    const otherField = document.getElementById('tradeOtherField');
    if (tradeSel && otherField) {
      tradeSel.onchange = () => { otherField.style.display = tradeSel.value === 'Other' ? 'block' : 'none'; };
    }
  }

  if (state.tab === 'bookings') {
    document.querySelectorAll('[data-booking-action]').forEach(btn=>{
      btn.onclick = async () => {
        const action = btn.dataset.bookingAction;
        try {
          await api(`/bookings/${btn.dataset.bookingId}`, { method:'PATCH', body: JSON.stringify({ status: action }) });
          await loadReceivedBookings();
          const messages = {
            accepted: 'The customer has been notified by email.',
            declined: 'The customer will see this as declined.',
            completed: 'The customer can now leave a rating for this job.',
          };
          showNotice('success', `Booking ${action}`, messages[action] || '');
        } catch (e) {
          showNotice('error', 'Could not update booking', e.message);
        }
      };
    });

    document.querySelectorAll('.star-pick').forEach(star=>{
      star.onclick = () => {
        const bid = star.dataset.bookingId;
        const val = Number(star.dataset.star);
        if (!state.ratingDrafts[bid]) state.ratingDrafts[bid] = { rating: 0, comment: '' };
        state.ratingDrafts[bid].rating = val;
        render();
      };
    });

    document.querySelectorAll('[data-comment-for]').forEach(ta=>{
      ta.oninput = (e) => {
        const bid = ta.dataset.commentFor;
        if (!state.ratingDrafts[bid]) state.ratingDrafts[bid] = { rating: 0, comment: '' };
        state.ratingDrafts[bid].comment = e.target.value;
      };
    });

    document.querySelectorAll('[data-submit-review]').forEach(btn=>{
      btn.onclick = async () => {
        const bid = btn.dataset.submitReview;
        const draft = state.ratingDrafts[bid] || { rating: 0, comment: '' };
        if (!draft.rating) { showNotice('error', 'Pick a rating', 'Choose at least one star before submitting.'); return; }
        try {
          await api('/reviews', { method:'POST', body: JSON.stringify({ bookingId: Number(bid), rating: draft.rating, comment: draft.comment || undefined }) });
          delete state.ratingDrafts[bid];
          await loadMyBookings();
          showNotice('success', 'Thanks for the rating!', 'Your review is now visible on their profile.');
        } catch (e) {
          showNotice('error', 'Could not submit rating', e.message);
        }
      };
    });
  }
}

function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

async function openProfile(id){
  const res = await api(`/artisans/${id}`);
  state.profileArtisan = res.data;
  state.modal = { type:'profile', id };
  try {
    const reviewsRes = await api(`/reviews/artisan/${id}`);
    state.profileReviews = reviewsRes.data;
  } catch (e) {
    state.profileReviews = [];
  }
  render();
}

function attachProfileModalHandlers(){
  const overlay = document.getElementById('overlay');
  overlay.onclick = (e)=>{ if(e.target.id==='overlay'){ closeModal(); } };
  document.getElementById('closeModal').onclick = closeModal;

  const loginFromModal = document.getElementById('loginFromModal');
  if (loginFromModal) loginFromModal.onclick = () => { state.modal = { type:'login' }; render(); };

  const sendBtn = document.getElementById('sendBooking');
  if (sendBtn) sendBtn.onclick = async () => {
    const message = document.getElementById('bookMessage').value.trim();
    const preferredDate = document.getElementById('bookDate').value || undefined;
    if (!message || message.length < 5) { showNotice('error', 'Add a bit more detail', 'Describe what you need done (at least 5 characters).'); return; }
    try {
      await api('/bookings', { method:'POST', body: JSON.stringify({ artisanId: state.profileArtisan.id, message, preferredDate }) });
      await loadMyBookings();
      const res = await api(`/artisans/${state.profileArtisan.id}`);
      state.profileArtisan = res.data;
      showNotice('success', 'Booking request sent', `${state.profileArtisan.name} has been notified by email and will reach out once they respond.`);
    } catch (e) {
      showNotice('error', 'Could not send booking', e.message);
    }
  };
}

function closeModal(){ state.modal = null; state.profileArtisan = null; state.profileReviews = []; state.authError=''; state.authMessage=''; render(); }

function attachAuthModalHandlers(mode){
  const overlay = document.getElementById('overlay');
  overlay.onclick = (e)=>{ if(e.target.id==='overlay'){ closeModal(); } };
  document.getElementById('closeModal').onclick = closeModal;
  document.getElementById('switchAuth').onclick = () => { state.modal = { type: mode==='login'?'signup':'login' }; state.authError=''; render(); };

  const forgotLink = document.getElementById('forgotLink');
  if (forgotLink) forgotLink.onclick = () => { state.modal = { type:'forgot' }; state.authError=''; state.authMessage=''; render(); };

  document.getElementById('authSubmit').onclick = async () => {
    state.authError = '';
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    try {
      if (mode === 'login') {
        const res = await api('/auth/login', { method:'POST', body: JSON.stringify({ email, password }) });
        setSession(res.token, res.user);
        state.modal = null;
        await loadArtisans();
        render();
      } else {
        const name = document.getElementById('auth-name').value.trim();
        const phone = document.getElementById('auth-phone').value.trim();
        const role = document.getElementById('auth-role').value;
        await api('/auth/signup', { method:'POST', body: JSON.stringify({ name, email, phone, password, role }) });
        // Account created but not usable yet — collect the OTP before granting a session.
        state.modal = { type: 'verify', email };
        state.authError = '';
        render();
      }
    } catch (e) {
      if (e.data && e.data.needsVerification) {
        state.modal = { type: 'verify', email: e.data.email };
        state.authError = '';
        render();
      } else {
        state.authError = e.message;
        render();
      }
    }
  };
}

function attachForgotModalHandlers(){
  const overlay = document.getElementById('overlay');
  overlay.onclick = (e)=>{ if(e.target.id==='overlay'){ closeModal(); } };
  document.getElementById('closeModal').onclick = closeModal;
  document.getElementById('backToLogin').onclick = () => { state.modal = { type:'login' }; state.authError=''; state.authMessage=''; render(); };

  document.getElementById('forgotSubmit').onclick = async () => {
    state.authError = ''; state.authMessage = '';
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) { state.authError = 'Enter your email first.'; render(); return; }
    try {
      const res = await api('/auth/forgot-password', { method:'POST', body: JSON.stringify({ email }) });
      state.authMessage = res.message + (res.devResetUrl ? ` (dev mode — no email server configured, use this link: ${res.devResetUrl})` : '');
      render();
    } catch (e) {
      state.authError = e.message;
      render();
    }
  };
}

function attachResetModalHandlers(){
  const overlay = document.getElementById('overlay');
  overlay.onclick = (e)=>{ if(e.target.id==='overlay'){ closeModal(); } };
  document.getElementById('closeModal').onclick = closeModal;

  document.getElementById('resetSubmit').onclick = async () => {
    state.authError = ''; state.authMessage = '';
    const token = document.getElementById('reset-token').value.trim();
    const password = document.getElementById('reset-password').value;
    if (!token) { state.authError = 'Paste the reset token from your link.'; render(); return; }
    if (!password || password.length < 8) { state.authError = 'Password must be at least 8 characters.'; render(); return; }
    try {
      const res = await api(`/auth/reset-password/${token}`, { method:'POST', body: JSON.stringify({ password }) });
      setSession(res.token, res.user);
      state.modal = null;
      await loadArtisans();
      render();
    } catch (e) {
      state.authError = e.message;
      render();
    }
  };
}

function attachVerifyModalHandlers(){
  const overlay = document.getElementById('overlay');
  overlay.onclick = (e)=>{ if(e.target.id==='overlay'){ closeModal(); } };
  document.getElementById('closeModal').onclick = closeModal;

  document.getElementById('verifySubmit').onclick = async () => {
    state.authError = ''; state.authMessage = '';
    const email = document.getElementById('verify-email').value.trim();
    const otp = document.getElementById('verify-otp').value.trim();
    if (!otp || otp.length !== 6) { state.authError = 'Enter the 6-digit code from your email.'; render(); return; }
    try {
      const res = await api('/auth/verify-email', { method:'POST', body: JSON.stringify({ email, otp }) });
      setSession(res.token, res.user);
      state.modal = null;
      await loadArtisans();
      showNotice('success', `Welcome, ${res.user.name.split(' ')[0]}!`, 'Your email is verified and your account is ready.');
    } catch (e) {
      state.authError = e.message;
      render();
    }
  };

  document.getElementById('resendOtpLink').onclick = async () => {
    state.authError = ''; state.authMessage = '';
    const email = document.getElementById('verify-email').value.trim();
    try {
      const res = await api('/auth/resend-otp', { method:'POST', body: JSON.stringify({ email }) });
      state.authMessage = res.message;
      render();
    } catch (e) {
      state.authError = e.message;
      render();
    }
  };
}

/* ---------- Init ---------- */

async function init(){
  try {
    await loadArtisans();
    if (getUser()) { await loadMyBookings(); await loadReceivedBookings(); }
  } catch (e) {
    console.error('Init error', e);
  }

  const urlToken = new URLSearchParams(window.location.search).get('token');
  if (urlToken) {
    state.modal = { type: 'reset', token: urlToken };
    window.history.replaceState({}, '', window.location.pathname); // scrub token from the visible URL
  }

  state.loaded = true;
  render();
}

init();
