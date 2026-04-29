
function showPage(name) {
  // Masque toutes les pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

  // Active la bonne page
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
  return false;
}


function openModal(tab) {
  switchTab(tab);
  resetForms();
  document.getElementById('modal-overlay').classList.add('open');
  // Focus sur le premier champ
  setTimeout(() => {
    const input = document.querySelector('#modal-overlay .modal-form.active input');
    if (input) input.focus();
  }, 200);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  resetForms();
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function switchTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('form-login').classList.toggle('active', tab === 'login');
  document.getElementById('form-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('modal-success').style.display = 'none';
  clearErrors();
}

function resetForms() {
  ['l-user','l-pass','s-user','s-pass'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  clearErrors();
  updatePwRules();
  document.getElementById('modal-success').style.display = 'none';
}

function clearErrors() {
  document.getElementById('login-error').textContent = '';
  document.getElementById('signup-error').textContent = '';
}

// Fermeture avec Echap
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});



const users = {
  alice: 'Alice123!',
  bob:   'Bob456@',
  admin: 'Admin789#'
};

function doLogin() {
  const username = document.getElementById('l-user').value.trim().toLowerCase();
  const password = document.getElementById('l-pass').value;
  const errEl    = document.getElementById('login-error');
  const btn      = document.getElementById('btn-login');

  if (!username || !password) {
    setError(errEl, 'Veuillez remplir tous les champs.');
    shakeBtn(btn);
    return;
  }

  // Animation de chargement
  btn.textContent = '…';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = 'Se connecter';
    btn.disabled = false;

    const knownUser = username in users;

    if (!knownUser) {
      // Username inconnu → message volontairement vague (mais différent — c'est la faille)
      setError(errEl, 'Invalid credentials.');
      shakeBtn(btn);
    } else if (users[username] !== password) {
      // Username connu, mauvais mot de passe → message légèrement différent (faille user enumeration)
      setError(errEl, 'Username or password incorrect.');
      shakeBtn(btn);
    } else {
      // Succès
      showSuccess('Connexion réussie. Bienvenue, ' + username + ' !');
    }
  }, 600);
}

function doSignup() {
  const username = document.getElementById('s-user').value.trim().toLowerCase();
  const password = document.getElementById('s-pass').value;
  const errEl    = document.getElementById('signup-error');
  const btn      = document.getElementById('btn-signup');

  if (!username) {
    setError(errEl, 'Choisissez un nom d\'utilisateur.');
    shakeBtn(btn);
    return;
  }

  if (username in users) {
    setError(errEl, 'Ce nom d\'utilisateur est déjà pris.');
    shakeBtn(btn);
    return;
  }

  // Validation mot de passe
  const pwErrors = validatePassword(password);
  if (pwErrors.length > 0) {
    setError(errEl, pwErrors[0]);
    shakeBtn(btn);
    return;
  }

  // Animation chargement
  btn.textContent = '…';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = 'Créer le compte';
    btn.disabled = false;

    // Enregistrement (en mémoire seulement)
    users[username] = password;
    showSuccess('Compte créé ! Bienvenue, ' + username + ' 🎉');
  }, 700);
}

function validatePassword(pw) {
  const errors = [];
  if (!/[A-Z]/.test(pw)) errors.push('Le mot de passe doit contenir au moins une majuscule.');
  if (!/[a-z]/.test(pw)) errors.push('Le mot de passe doit contenir au moins une minuscule.');
  if (!/[0-9]/.test(pw)) errors.push('Le mot de passe doit contenir au moins un chiffre.');
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push('Le mot de passe doit contenir au moins un caractère spécial (!@#$%...).');
  return errors;
}

function updatePwRules() {
  const pw = document.getElementById('s-pass').value;
  setRule('r-upper',   /[A-Z]/.test(pw));
  setRule('r-lower',   /[a-z]/.test(pw));
  setRule('r-digit',   /[0-9]/.test(pw));
  setRule('r-special', /[^A-Za-z0-9]/.test(pw));
}

function setRule(id, ok) {
  document.getElementById(id).classList.toggle('ok', ok);
}

function setError(el, msg) {
  el.textContent = msg;
}

function showSuccess(msg) {
  document.getElementById('form-login').classList.remove('active');
  document.getElementById('form-signup').classList.remove('active');
  const s = document.getElementById('modal-success');
  document.getElementById('modal-success-text').textContent = msg;
  s.style.display = 'block';
  // Fermeture auto après 2.5s
  setTimeout(closeModal, 2500);
}


// Effet ripple sur tous les .btn-primary
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.btn-primary');
  if (!btn) return;

  const rect   = btn.getBoundingClientRect();
  const size   = Math.max(rect.width, rect.height);
  const x      = e.clientX - rect.left - size / 2;
  const y      = e.clientY - rect.top  - size / 2;

  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  btn.appendChild(ripple);

  ripple.addEventListener('animationend', () => ripple.remove());
});

// Shake sur erreur
function shakeBtn(btn) {
  btn.style.transition = 'transform 0.1s';
  const steps = [6, -6, 4, -4, 2, -2, 0];
  let i = 0;
  const step = () => {
    if (i >= steps.length) { btn.style.transform = ''; return; }
    btn.style.transform = `translateX(${steps[i]}px)`;
    i++;
    setTimeout(step, 60);
  };
  step();
}

// Highlight hover sur les feature cards
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
    const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
    card.style.background = `radial-gradient(circle at ${x}% ${y}%, #f0f7f4 0%, #fff 60%)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.background = '';
  });
});


function sendContact() {
  const name  = document.getElementById('c-name').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const msg   = document.getElementById('c-msg').value.trim();
  const btn   = document.getElementById('btn-contact');

  if (!name || !email || !msg) {
    btn.textContent = 'Remplissez tous les champs';
    btn.style.background = '#c0392b';
    setTimeout(() => {
      btn.textContent = 'Envoyer';
      btn.style.background = '';
    }, 1800);
    return;
  }

  btn.textContent = '…';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = 'Envoyer';
    btn.disabled = false;
    document.getElementById('c-name').value  = '';
    document.getElementById('c-email').value = '';
    document.getElementById('c-msg').value   = '';
    const success = document.getElementById('contact-success');
    success.style.display = 'block';
    setTimeout(() => success.style.display = 'none', 4000);
  }, 900);
}