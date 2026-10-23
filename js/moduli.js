/* Funzioni comuni ai moduli online CSAIN Padel Club Cup / Winter Cup
   - pulsante "Invia": manda i dati del modulo all'archivio dell'organizzazione
   - "Scarica PDF": i campi compilati vengono riprodotti fedelmente nel PDF A4 */

// Indirizzo di ricezione dei moduli (Google Apps Script). Vuoto = invio non ancora attivo.
window.CSAIN_INVIO_URL = window.CSAIN_INVIO_URL || '';

(function () {
  var FIELDS = 'input:not([type=hidden]):not([type=button]):not([type=submit]), textarea, select';
  var TEXTUAL = 'input[type=text], input:not([type]), input[type=date], input[type=time], input[type=tel], input[type=email], input[type=number], textarea';

  // --- PDF: sostituisce i campi di testo con riquadri statici nella copia usata da html2canvas
  window.CSAINclone = function (doc) {
    var orig = document.querySelectorAll(TEXTUAL);
    var copy = doc.querySelectorAll(TEXTUAL);
    for (var i = 0; i < copy.length && i < orig.length; i++) {
      var o = orig[i], c = copy[i];
      var cs = window.getComputedStyle(o);
      var d = doc.createElement('div');
      var isArea = o.tagName === 'TEXTAREA';
      var w = o.offsetWidth, h = o.offsetHeight;
      var props = ['font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'color', 'text-align', 'text-transform',
        'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'border-top', 'border-right', 'border-bottom', 'border-left', 'border-radius', 'background-color', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left'];
      props.forEach(function (p) { d.style.setProperty(p, cs.getPropertyValue(p)); });
      d.style.boxSizing = 'border-box';
      d.style.display = cs.display === 'block' ? 'block' : 'inline-block';
      d.style.width = w + 'px';
      d.style.height = h + 'px';
      d.style.overflow = 'hidden';
      d.style.verticalAlign = cs.verticalAlign;
      d.style.flex = cs.flex;
      if (isArea) {
        d.style.whiteSpace = 'pre-wrap';
        d.style.lineHeight = cs.lineHeight;
      } else {
        var inner = h - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth);
        d.style.whiteSpace = 'nowrap';
        d.style.lineHeight = Math.max(inner, 0) + 'px';
      }
      var v = o.value;
      if (!v) { d.style.color = 'transparent'; v = '.'; }
      d.textContent = v;
      c.parentNode.replaceChild(d, c);
    }
  };

  // --- Raccolta dei dati compilati
  function labelFor(el, i) {
    if (el.id && !/^\d/.test(el.id)) return el.id;
    if (el.id && document.querySelector('label[for="' + el.id + '"]')) return document.querySelector('label[for="' + el.id + '"]').innerText.trim();
    var f = el.closest('.f, .field, .panel');
    var l = f && f.querySelector('.lbl, label');
    if (l && !l.contains(el) && l.innerText.trim()) return l.innerText.trim();
    var lab = el.closest('label');
    if (lab && lab.innerText.trim()) return lab.innerText.trim();
    var td = el.closest('td');
    if (td) {
      var tr = td.closest('tr'), table = td.closest('table');
      var first = tr && tr.querySelector('td,th');
      var idx = Array.prototype.indexOf.call(tr.children, td);
      var head = table && table.querySelector('thead tr');
      var col = head && head.children[idx] ? head.children[idx].innerText.trim() : 'col' + idx;
      var row = first && first !== td ? first.innerText.trim() : 'riga';
      var n = Array.prototype.indexOf.call(td.querySelectorAll(FIELDS), el);
      return row + ' · ' + col + (td.querySelectorAll(FIELDS).length > 1 ? ' · ' + (n + 1) : '');
    }
    return el.placeholder || el.name || el.id || ('campo ' + (i + 1));
  }

  function raccogli() {
    var campi = [];
    var seen = {};
    document.querySelectorAll('.page').forEach(function (page) {
      page.querySelectorAll(FIELDS).forEach(function (el, i) {
        var k = labelFor(el, i);
        if (seen[k]) { seen[k]++; k = k + ' (' + seen[k] + ')'; } else seen[k] = 1;
        var v;
        if (el.type === 'checkbox') v = el.checked ? 'SÌ' : '';
        else if (el.type === 'radio') { if (!el.checked) return; v = el.value || labelFor(el, i); k = el.name || k; }
        else v = el.value;
        campi.push({ k: k, v: v });
      });
    });
    return campi;
  }

  function toastMsg(t) {
    var x = document.getElementById('toast');
    if (!x) { alert(t); return; }
    x.textContent = t; x.classList.add('show');
    setTimeout(function () { x.classList.remove('show'); }, 4000);
  }

  window.inviaModulo = function () {
    var campi = raccogli();
    var compilati = campi.filter(function (c) { return c.v && String(c.v).trim(); }).length;
    if (compilati < 3) { toastMsg('Compila il modulo prima di inviarlo'); return; }
    if (!window.CSAIN_INVIO_URL) {
      toastMsg('Invio online non ancora attivo: usa Stampa o Scarica PDF e invia il modulo via e-mail');
      return;
    }
    if (!confirm('Confermi l’invio del modulo all’organizzazione?')) return;
    var payload = {
      modulo: document.body.dataset.modulo || document.title,
      manifestazione: document.body.dataset.manifestazione || '',
      inviato: new Date().toISOString(),
      pagina: location.pathname,
      campi: campi
    };
    fetch(window.CSAIN_INVIO_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
      .then(function () { toastMsg('Modulo inviato. Ora stampalo o scarica il PDF, firmalo e invia la copia firmata.'); })
      .catch(function () { toastMsg('Invio non riuscito: controlla la connessione e riprova'); });
  };
})();
