# Volvic Deal Finder – Textsuche

Installierbare kostenlose PWA. Auf der Startseite befindet sich ein deutlich sichtbares Suchfeld mit der Schaltfläche **Angebote suchen**. Die Suche ergänzt „Volvic“, wenn nur eine Sorte oder Produktart eingegeben wird, z. B. `Eistee`, `Touch Zitrone` oder `Naturell`.

## Datenquelle

Die App verwendet die öffentliche PrijsProfeet-API:
`https://www.prijsprofeet.de/api/v1/search`

Der deutsche API-Host verlangt technisch einen festen Quellenfilter. Die derzeit verfügbare deutsche Abdeckung ist daher auf einen Händler begrenzt. Für die übrigen Händler gibt es in dieser Datenquelle derzeit keine deutschen Angebotsdaten. Die Händlerübersicht in der App kennzeichnet diese Lücken ausdrücklich.

Die App filtert auf aktive Angebote und zeigt nur Treffer mit Volvic-Bezug und auswertbarem Preis. Es werden keine regulären Regalpreise als Sonderangebote ausgegeben.

## Suche und Aktualisierung

- Suchbegriff eingeben und **Angebote suchen** drücken oder Enter verwenden.
- Die App ergänzt Volvic automatisch, falls es nicht im Suchbegriff vorkommt.
- Ergebnisse werden pro Suchbegriff lokal zwischengespeichert.
- Beim erneuten Öffnen werden vorhandene Ergebnisse angezeigt und nach Ablauf des Cache-Zeitraums neu abgerufen.
- Bei API-Fehlern, CORS-Problemen oder nicht erkanntem Antwortformat erscheint eine Fehlermeldung.

## Grenzen

- Die Datenquelle bietet keine verlässlichen Filialadressen oder Koordinaten für eine PLZ-Umkreissuche.
- Eine PWA kann nicht zuverlässig im Hintergrund suchen, wenn sie vollständig geschlossen ist.
- Die API-Abfrage aus dem Browser funktioniert nur, wenn der Anbieter CORS für GitHub Pages zulässt.
- Die Abdeckung ist nicht mit allen zehn gewünschten Supermarktketten gleichzusetzen.

## Veröffentlichung

1. ZIP entpacken.
2. Alle Dateien und den Ordner `icons` im GitHub-Repository hochladen und vorhandene Dateien überschreiben.
3. `index.html` muss im Repository-Hauptverzeichnis liegen.
4. Änderungen committen. GitHub Pages veröffentlicht die neue Version.
5. Auf Android die App vollständig schließen und erneut öffnen. Falls die alte Version angezeigt wird, die Website in Chrome neu laden.

## Quellenangabe

Angebotsdaten: [PrijsProfeet](https://www.prijsprofeet.de). Bitte Preis und Verfügbarkeit vor Ort prüfen.
