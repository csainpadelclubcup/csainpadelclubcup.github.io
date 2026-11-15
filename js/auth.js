/* Accesso al sito CSAIN Padel Club Cup (stesso servizio di accesso del sito Sport & Services).
   Livello 1 = account generico (registrazione normale, entra in tutte le pagine).
   Livello 2 = riconoscimento personale con codice via mail, per le sezioni personali (CSAINAuth.personale). */
(function () {
  var SB = 'https://hbmmlnyfiesmmbmxkmcp.supabase.co';
  var KEY = 'sb_publishable_TYJtDyl4jTCrVNPYCJ-B4w_00i41uID';
  var K = 'csain_sessione';
  var BASE = location.origin + location.pathname.replace(/[^\/]*$/, '');

  function leggi() { try { return JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { return null; } }
  function salva(s) { try { if (s) localStorage.setItem(K, JSON.stringify(s)); else localStorage.removeItem(K); } catch (e) {} }
  function daRisposta(j) {
    var email = j.user && j.user.email;
    return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (j.expires_in || 3600), email: email, nome: (j.user && j.user.user_metadata && j.user.user_metadata.nome) || '' };
  }
  function req(path, opt) {
    opt = opt || {};
    var h = { apikey: KEY, 'Content-Type': 'application/json' };
    if (opt.token) h.Authorization = 'Bearer ' + opt.token;
    return fetch(SB + path, { method: opt.method || 'GET', headers: Object.assign(h, opt.headers || {}), body: opt.body ? JSON.stringify(opt.body) : undefined })
      .then(function (r) { return r.text().then(function (t) { var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {} return { ok: r.ok, status: r.status, data: j }; }); });
  }
  function errore(r) {
    var m = (r.data && (r.data.msg || r.data.error_description || r.data.message || r.data.error)) || '';
    if (/Invalid login credentials/i.test(m)) return 'Email o password non corretti.';
    if (/Email not confirmed/i.test(m)) return 'Devi prima confermare la tua email: apri il link che ti abbiamo inviato.';
    if (/already registered|already been registered/i.test(m)) return 'Esiste già un account con questa email: usa "Accedi".';
    if (/Password should be/i.test(m)) return 'La password deve avere almeno 8 caratteri.';
    if (/rate limit|too many/i.test(m) || r.status === 429) return 'Troppi tentativi in poco tempo: riprova tra qualche minuto.';
    if (/valid email|invalid format/i.test(m)) return 'Controlla l’indirizzo email.';
    return 'Qualcosa non ha funzionato, riprova. ' + (m ? '(' + m + ')' : '');
  }

  var Auth = {
    sessione: leggi,
    errore: errore,
    // restituisce un token valido (rinnova se scaduto) oppure null
    token: function () {
      var s = leggi();
      if (!s) return Promise.resolve(null);
      if (s.expires_at - 60 > Date.now() / 1000) return Promise.resolve(s.access_token);
      return req('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } }).then(function (r) {
        if (!r.ok) { salva(null); return null; }
        var n = daRisposta(r.data); salva(n); return n.access_token;
      });
    },
    accedi: function (email, password) {
      return req('/auth/v1/token?grant_type=password', { method: 'POST', body: { email: email, password: password } }).then(function (r) {
        if (r.ok) salva(daRisposta(r.data));
        return r;
      });
    },
    registrati: function (email, password, dati) {
      return req('/auth/v1/signup?redirect_to=' + encodeURIComponent(BASE + 'account.html'), { method: 'POST', body: { email: email, password: password, data: dati } });
    },
    recupera: function (email) {
      return req('/auth/v1/recover?redirect_to=' + encodeURIComponent(BASE + 'account.html'), { method: 'POST', body: { email: email } });
    },
    nuovaPassword: function (password) {
      return Auth.token().then(function (t) { return req('/auth/v1/user', { method: 'PUT', token: t, body: { password: password } }); });
    },
    esci: function () {
      var s = leggi(); salva(null);
      if (s) req('/auth/v1/logout', { method: 'POST', token: s.access_token });
    },
    // legge il risultato del link nella mail (conferma account o recupero password)
    daLink: function () {
      var h = location.hash.replace(/^#/, '');
      if (!h || h.indexOf('access_token=') < 0 && h.indexOf('error') < 0) return Promise.resolve(null);
      var p = {}; h.split('&').forEach(function (kv) { var i = kv.indexOf('='); p[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent((kv.slice(i + 1) || '').replace(/\+/g, ' ')); });
      history.replaceState(null, '', location.pathname + location.search);
      if (p.error) return Promise.resolve({ errore: p.error_description || p.error });
      return req('/auth/v1/user', { token: p.access_token }).then(function (r) {
        salva({ access_token: p.access_token, refresh_token: p.refresh_token, expires_at: +p.expires_at || Math.floor(Date.now() / 1000) + 3600, email: r.data && r.data.email, nome: (r.data && r.data.user_metadata && r.data.user_metadata.nome) || '' });
        return { tipo: p.type || 'signup' };
      });
    },
    // interrogazione al database con il token dell'utente
    db: function (path) {
      return Auth.token().then(function (t) { if (!t) return { ok: false, status: 401, data: null }; return req('/rest/v1/' + path, { token: t }); });
    },
    // invio di una riga (modulo) con il token dell'utente
    invia: function (tabella, riga) {
      return Auth.token().then(function (t) { if (!t) return { ok: false, status: 401, data: null }; return req('/rest/v1/' + tabella, { method: 'POST', token: t, body: riga, headers: { Prefer: 'return=minimal' } }); });
    },
    // chiamata a una funzione del sito (es. invio del codice per aprire la scheda)
    funzione: function (nome, body) {
      return Auth.token().then(function (t) { if (!t) return { ok: false, status: 401, data: null }; return req('/functions/v1/' + nome, { method: 'POST', token: t, body: body }); });
    },

    // ---- LIVELLO 1: account generico ----
    // true se c'è una sessione salvata
    loggato: function () { return !!leggi(); },
    // da mettere in una pagina riservata: se non si è entrati, porta all'accesso e poi torna alla pagina
    richiediAccesso: function () {
      return Auth.token().then(function (t) {
        if (t) return true;
        location.replace('account.html?next=' + encodeURIComponent(location.pathname.split('/').pop() || 'index.html'));
        return false;
      });
    },
    // ---- LIVELLO 2: riconoscimento personale (codice di 6 cifre via mail) ----
    // sezione: nome della sezione personale (es. "club"); la funzione "csain-codice" controlla nome, cognome e data di nascita
    personale: {
      richiedi: function (sezione) { return Auth.funzione('csain-codice', { azione: 'richiedi', sezione: sezione }); },
      verifica: function (sezione, codice) { return Auth.funzione('csain-codice', { azione: 'verifica', sezione: sezione, codice: codice }); },
      // le righe personali già sbloccate per questo account (la sicurezza è nel database: ognuno vede solo le sue)
      mie: function (sezione) { return Auth.db('csain_personale?sezione=eq.' + encodeURIComponent(sezione) + '&select=id,nome,aggiornata,dati&order=nome'); }
    },
    // dati del profilo (nome, cognome, telefono) salvati alla registrazione
    profilo: function () {
      return Auth.token().then(function (t) { if (!t) return null; return req('/auth/v1/user', { token: t }).then(function (r) { return r.ok ? (r.data.user_metadata || {}) : null; }); });
    }
  };
  window.CSAINAuth = Auth;

  // voce "Accedi · Registrati" nel menù: diventa "Il mio account" quando si è entrati
  document.addEventListener('DOMContentLoaded', function () {
    if (leggi()) document.querySelectorAll('a.nav-acc').forEach(function (a) { a.textContent = 'Il mio account'; });
  });
})();
