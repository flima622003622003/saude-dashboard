/* js/auth.js — Login com Google via Firebase */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyCC5duEmqyMJrdEac4LtBXAovtaFW6jNNQ",
  authDomain:        "saude-dashboard-91c68.firebaseapp.com",
  projectId:         "saude-dashboard-91c68",
  storageBucket:     "saude-dashboard-91c68.firebasestorage.app",
  messagingSenderId: "294949615154",
  appId:             "1:294949615154:web:86b8b95f6eb5f1281eee2b"
};

// Email autorizado — só você entra
const AUTHORIZED_EMAIL = 'flima622003622003@gmail.com';

let authInitialized = false;

/* ── Inicializa Firebase e verifica sessão ──────────────────────── */
function initAuth(onAuthorized) {
  // Carrega Firebase via CDN
  const script1 = document.createElement('script');
  script1.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js';
  script1.onload = function() {
    const script2 = document.createElement('script');
    script2.src = 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js';
    script2.onload = function() {
      firebase.initializeApp(FIREBASE_CONFIG);
      firebase.auth().onAuthStateChanged(function(user) {
        if (user && user.email === AUTHORIZED_EMAIL) {
          showApp(user);
          if (!authInitialized) {
            authInitialized = true;
            onAuthorized();
          }
        } else if (user) {
          // Email não autorizado
          firebase.auth().signOut();
          showLogin('Email não autorizado. Use a conta correta do Gmail.');
        } else {
          showLogin('');
        }
      });
    };
    document.head.appendChild(script2);
  };
  document.head.appendChild(script1);
}

/* ── Login com Google ───────────────────────────────────────────── */
function loginWithGoogle() {
  const btn = document.getElementById('login-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }

  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  firebase.auth().signInWithPopup(provider)
    .then(function(result) {
      if (result.user.email !== AUTHORIZED_EMAIL) {
        firebase.auth().signOut();
        showLogin('Email não autorizado: ' + result.user.email);
      }
    })
    .catch(function(error) {
      if (btn) { btn.disabled = false; btn.textContent = 'Entrar com Google'; }
      if (error.code !== 'auth/popup-closed-by-user') {
        showLogin('Erro ao entrar: ' + error.message);
      }
    });
}

/* ── Logout ─────────────────────────────────────────────────────── */
function logout() {
  firebase.auth().signOut();
}

/* ── UI: tela de login ──────────────────────────────────────────── */
function showLogin(errorMsg) {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('main-content').style.display = 'none';
  const errEl = document.getElementById('login-error');
  if (errEl) errEl.textContent = errorMsg;
  const btn = document.getElementById('login-btn');
  if (btn) { btn.disabled = false; btn.textContent = 'Entrar com Google'; }
}

/* ── UI: mostra o app ───────────────────────────────────────────── */
function showApp(user) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('main-content').style.display = 'block';
  // Mostra nome do usuário no header
  const el = document.getElementById('user-name');
  if (el) el.textContent = user.displayName || user.email;
  const avatar = document.getElementById('user-avatar');
  if (avatar && user.photoURL) {
    avatar.src = user.photoURL;
    avatar.style.display = 'block';
  }
}
