// ══════════════════════════════════════════════════════
//  shared.js  —  Nav + Modal injectés sur chaque page
// ══════════════════════════════════════════════════════

// Détecte la page active d'après le nom du fichier
const currentPage = location.pathname.split('/').pop() || 'index.html';
const navActive = {
  'index.html':   'nav-home',
  'about.html':   'nav-about',
  'contact.html': 'nav-contact',
};

// ── Injection du HTML partagé ──────────────────────
document.body.insertAdjacentHTML('afterbegin', `
<nav>
  <a href="index.html" class="nav-logo">Nomade</a>
  <ul class="nav-links">
    <li><a href="index.html"   id="nav-home">Accueil</a></li>
    <li><a href="about.html"   id="nav-about">En savoir plus</a></li>
    <li><a href="contact.html" id="nav-contact">Contact</a></li>
    <li><a href="#" class="btn-nav" onclick="openModal(); return false;">Se connecter</a></li>
  </ul>
</nav>
`);

document.body.insertAdjacentHTML('beforeend', `
<footer>
  © 2025 Nomade — <a href="contact.html">Contact</a>
</footer>

<div class="modal-overlay" id="modal-overlay">
  <div class="modal" id="modal-box">

    <button class="modal-close" onclick="closeModal()" aria-label="Fermer">✕</button>

    <!-- Écran 1 : choix -->
    <div class="modal-home" id="modal-home">
      <p class="modal-home-title">Nomade</p>
      <p class="modal-home-sub">Connectez-vous ou créez un compte</p>
      <div class="modal-home-btns">
        <button class="btn-modal-choice btn-modal-login"  onclick="expandTo('login')">Se connecter</button>
        <button class="btn-modal-choice btn-modal-signup" onclick="expandTo('signup')">Créer un compte</button>
      </div>
    </div>

    <!-- Écran 2 : connexion -->
    <div class="modal-form-wrap" id="wrap-login">
      <div class="modal-form-header">
        <button class="btn-back" onclick="collapseToHome()">←</button>
        <span class="modal-form-title">Connexion</span>
      </div>
      <div class="modal-field">
        <label for="l-user">Nom d'utilisateur</label>
        <input type="text" id="l-user" placeholder="ex : alice" autocomplete="username" />
      </div>
      <div class="modal-field">
        <label for="l-pass">Mot de passe</label>
        <input type="password" id="l-pass" placeholder="••••••••" autocomplete="current-password" />
      </div>
      <div class="modal-error" id="login-error"></div>
      <button class="btn-modal-submit" id="btn-login" onclick="doLogin()">Se connecter</button>
    </div>

    <!-- Écran 3 : inscription -->
    <div class="modal-form-wrap" id="wrap-signup">
      <div class="modal-form-header">
        <button class="btn-back" onclick="collapseToHome()">←</button>
        <span class="modal-form-title">Créer un compte</span>
      </div>
      <div class="modal-field">
        <label for="s-user">Nom d'utilisateur</label>
        <input type="text" id="s-user" placeholder="ex : alice" autocomplete="username" />
      </div>
      <div class="modal-field">
        <label for="s-email">Adresse e-mail</label>
        <input type="email" id="s-email" placeholder="vous@example.com" autocomplete="email" />
      </div>
      <div class="modal-field">
        <label for="s-pass">Mot de passe</label>
        <input type="password" id="s-pass" placeholder="Aa1@••••" autocomplete="new-password" oninput="updatePwRules()" />
        <div class="pw-rules">
          <span class="pw-rule" id="r-upper">Majuscule</span>
          <span class="pw-rule" id="r-lower">Minuscule</span>
          <span class="pw-rule" id="r-digit">Chiffre</span>
          <span class="pw-rule" id="r-special">Spécial</span>
        </div>
      </div>
      <div class="modal-error" id="signup-error"></div>
      <button class="btn-modal-submit" id="btn-signup" onclick="doSignup()">Créer le compte</button>
    </div>

    <!-- Succès -->
    <div class="modal-success-msg" id="modal-success">
      <span class="checkmark">✓</span>
      <p id="modal-success-text">Bienvenue !</p>
    </div>

  </div>
</div>
`);

// Marque le lien actif
const activeId = navActive[currentPage];
if (activeId) {
  const el = document.getElementById(activeId);
  if (el) el.classList.add('active');
}

// Fermeture en cliquant hors du carré
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// Fermeture Echap
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});


// ══════════════════════════════════════
//  MODAL : logique expand / collapse
// ══════════════════════════════════════

function openModal() {
  resetForms();
  showScreen('home');
  document.getElementById('modal-box').classList.remove('expanded-login','expanded-signup');
  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  setTimeout(resetForms, 300);
}

function showScreen(name) {
  document.getElementById('modal-home').style.display     = name === 'home'    ? 'block' : 'none';
  document.getElementById('wrap-login').classList.toggle('active',  name === 'login');
  document.getElementById('wrap-signup').classList.toggle('active', name === 'signup');
  document.getElementById('modal-success').style.display = name === 'success' ? 'block' : 'none';
}

function expandTo(type) {
  const home = document.getElementById('modal-home');
  home.style.transition = 'opacity 0.15s';
  home.style.opacity = '0';
  setTimeout(() => {
    home.style.display = 'none';
    home.style.opacity = '';
    home.style.transition = '';
    document.getElementById('modal-box').classList.add(type === 'login' ? 'expanded-login' : 'expanded-signup');
    setTimeout(() => {
      showScreen(type);
      const input = document.querySelector(`#wrap-${type} input`);
      if (input) input.focus();
    }, 120);
  }, 150);
}

function collapseToHome() {
  const wrap = document.querySelector('.modal-form-wrap.active');
  if (!wrap) return;
  wrap.style.transition = 'opacity 0.15s';
  wrap.style.opacity = '0';
  setTimeout(() => {
    wrap.style.opacity = '';
    wrap.style.transition = '';
    wrap.classList.remove('active');
    document.getElementById('modal-box').classList.remove('expanded-login','expanded-signup');
    clearErrors();
    document.getElementById('modal-home').style.display = 'block';
  }, 150);
}

function resetForms() {
  ['l-user','l-pass','s-user','s-email','s-pass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  clearErrors();
  updatePwRules();
  document.getElementById('modal-success').style.display = 'none';
}

function clearErrors() {
  document.getElementById('login-error').textContent  = '';
  document.getElementById('signup-error').textContent = '';
}


// ══════════════════════════════════════
//  AUTH
// ══════════════════════════════════════

const users = { alice: 'Alice123!', bob: 'Bob456@', admin: 'Admin789#' };

function doLogin() {
  const username = document.getElementById('l-user').value.trim().toLowerCase();
  const password = document.getElementById('l-pass').value;
  const errEl    = document.getElementById('login-error');
  const btn      = document.getElementById('btn-login');

  if (!username || !password) {
    errEl.textContent = 'Veuillez remplir tous les champs.';
    shakeBtn(btn); return;
  }

  btn.textContent = '…';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = 'Se connecter';
    btn.disabled = false;
    if (!(username in users)) {
      errEl.textContent = 'Invalid credentials.';
      shakeBtn(btn);
    } else if (users[username] !== password) {
      errEl.textContent = 'Username or password incorrect.';
      shakeBtn(btn);
    } else {
      showSuccess('Connexion réussie. Bienvenue, ' + username + ' !');
    }
  }, 600);
}

function doSignup() {
  const username = document.getElementById('s-user').value.trim().toLowerCase();
  const password = document.getElementById('s-pass').value;
  const errEl    = document.getElementById('signup-error');
  const btn      = document.getElementById('btn-signup');

  if (!username) { errEl.textContent = "Choisissez un nom d'utilisateur."; shakeBtn(btn); return; }
  if (username in users) { errEl.textContent = 'Nom déjà pris.'; shakeBtn(btn); return; }

  const pwErr = validatePassword(password);
  if (pwErr) { errEl.textContent = pwErr; shakeBtn(btn); return; }

  btn.textContent = '…';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Créer le compte';
    btn.disabled = false;
    users[username] = password;
    showSuccess('Compte créé ! Bienvenue, ' + username + ' 🎉');
  }, 700);
}

function validatePassword(pw) {
  if (!/[A-Z]/.test(pw)) return 'Ajoutez au moins une majuscule.';
  if (!/[a-z]/.test(pw)) return 'Ajoutez au moins une minuscule.';
  if (!/[0-9]/.test(pw)) return 'Ajoutez au moins un chiffre.';
  if (!/[^A-Za-z0-9]/.test(pw)) return 'Ajoutez au moins un caractère spécial (!@#...).';
  return null;
}

function updatePwRules() {
  const pw = document.getElementById('s-pass').value;
  const set = (id, ok) => document.getElementById(id).classList.toggle('ok', ok);
  set('r-upper',   /[A-Z]/.test(pw));
  set('r-lower',   /[a-z]/.test(pw));
  set('r-digit',   /[0-9]/.test(pw));
  set('r-special', /[^A-Za-z0-9]/.test(pw));
}

function showSuccess(msg) {
  const wrap = document.querySelector('.modal-form-wrap.active');
  if (wrap) wrap.classList.remove('active');
  document.getElementById('modal-success-text').textContent = msg;
  document.getElementById('modal-success').style.display = 'block';
  setTimeout(closeModal, 2500);
}


// ══════════════════════════════════════
//  ANIMATIONS globales
// ══════════════════════════════════════

// Ripple sur .btn-primary et .btn-modal-submit
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn-primary, .btn-modal-submit');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top  - size / 2;
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  btn.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
});

// Shake
function shakeBtn(btn) {
  const steps = [6,-6,4,-4,2,-2,0];
  let i = 0;
  const go = () => {
    if (i >= steps.length) { btn.style.transform = ''; return; }
    btn.style.transform = `translateX(${steps[i++]}px)`;
    setTimeout(go, 55);
  };
  go();
}

// Glow hover sur feature cards (si présentes)
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width  * 100).toFixed(1);
    const y = ((e.clientY - r.top)  / r.height * 100).toFixed(1);
    card.style.background = `radial-gradient(circle at ${x}% ${y}%, #f0f7f4 0%, #fff 60%)`;
  });
  card.addEventListener('mouseleave', () => { card.style.background = ''; });
});