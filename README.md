# CSAIN Padel Club Cup

Sito ufficiale della CSAIN Padel Club Cup e della CSAIN Padel Winter Cup 2027.

## Regole grafiche del sito

Tutte le pagine seguono queste regole: ogni modifica nuova deve rispettarle.

- **Colori:** blu notte #0B2545 (testi e fondi pieni), lime #D4F04A (accento e pulsante principale), verde #3A6B1F (etichette su fondo chiaro), grigio-blu #3F5168 / #4F6177 (testo secondario), bordi #D5DDE6.
- **Caratteri:** titoli in Barlow Condensed 800 maiuscolo; testo in Barlow.
- **Titolo di pagina (h1):** clamp(44px, 6vw, 84px), interlinea 0.95, su una riga dove lo spazio lo permette.
- **Titolo di sezione (h2):** clamp(34px, 4.4vw, 56px), interlinea 1. Titoli "premio" in minuscolo (Diventa Campione…, Vinci il Club dell'Anno…): stessa misura, interlinea 1.05.
- **Titolo di blocco o riquadro:** clamp(28px, 3vw, 40px).
- **Etichetta sopra i titoli:** 14px, 600, maiuscolo, spaziatura 0.14em; verde su fondo chiaro, lime su fondo blu.
- **Angoli:** fasce grandi 28px; riquadri, foto e moduli 20px; pulsanti-riquadro 16px; campi dei moduli 10px; pulsanti 999px (pillola).
- **Pulsanti principali:** pillola, 16px × 28px di imbottitura, testo 17px 600; lime su fondo blu, blu su fondo chiaro.
- **Spazi:** sezioni larghe al massimo 1240px con 24px ai lati; 64px sopra ogni sezione, 88px in fondo all'ultima.
- **Calendari e formule:** tappe in fila con data in grande e linea sopra (lime per la prima, blu per le altre), mai riquadri colorati pieni.
- **Foto affiancate a un blocco:** foto a sinistra, contenuto a destra; alternare il lato del blocco pieno tra sezioni vicine.

## Account e accesso (due livelli)

Stesso sistema di accesso del sito sportandservicespadel.it (stesso servizio di accesso), con sessione separata per questo sito.

- **Livello 1, account generico:** pagina `account.html` (registrazione normale con conferma via mail, accesso, password dimenticata). Per rendere riservata una pagina: includere `js/auth.js` e aggiungere `<script>CSAINAuth.richiediAccesso()</script>` in testa; chi non è entrato viene portato all'accesso e poi torna alla pagina.
- **Livello 2, riconoscimento personale:** `CSAINAuth.personale.richiedi(sezione)` manda un codice di 6 cifre alla mail scritta nella riga personale (controlla nome, cognome e data di nascita del profilo); `CSAINAuth.personale.verifica(sezione, codice)` apre i dati; `CSAINAuth.personale.mie(sezione)` legge le righe sbloccate. Backend: `supabase/csain-livello2.sql` e `supabase/functions/csain-codice`. Le sezioni personali non sono ancora state create.
- Le pagine pubbliche (regolamento, calendari, moduli, iscrizioni) restano aperte a tutti.
