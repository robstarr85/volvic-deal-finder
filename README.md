# Volvic Deal Finder – Textsuche (ALDI Süd)

Installierbare kostenlose PWA. Auf der Startseite kann im Suchfeld ein Produktbegriff eingegeben werden. Die App ergänzt „Volvic“, falls es nicht bereits enthalten ist, und sucht z. B. nach `Volvic Eistee`, `Volvic Touch Zitrone` oder `Volvic`. Enter oder „Suchen“ startet den API-Aufruf.

## Datenquelle

Die App verwendet die öffentliche PrijsProfeet-API:
`https://www.prijsprofeet.de/api/v1/search?q=...&retailer=aldi_sued&promotion_status=active&page_size=100`

Laut offizieller Dokumentation unterstützt `/search` eine unscharfe Textsuche und den Filter `promotion_status=active`. Die deutsche API stellt derzeit ausschließlich ALDI Süd bereit. Die kostenlose Nutzung erfordert eine sichtbare Quellenangabe, die in der App enthalten ist. Quelle: https://github.com/PrijsProfeet/supermarkt-api

## Verhalten

- Suchbegriff wird dynamisch an die API übergeben.
- Suchergebnisse werden lokal pro Suchbegriff für 24 Stunden zwischengespeichert.
- Nur erkannte Volvic-Treffer mit Preis und aktivem Angebotsstatus werden angezeigt.
- API-Fehler, leere Ergebnisse und nicht erkannte Datenstrukturen werden ausdrücklich gemeldet.
- Die App behauptet nicht, dass andere Händler durchsucht werden.

## Grenzen

- Keine PLZ-/Umkreissuche: Die deutsche API liefert keine verlässlichen Filialadressen/Koordinaten.
- Keine Hintergrundsuche bei geschlossener App. Beim Öffnen wird der gespeicherte Suchbegriff verwendet; manuell kann jederzeit erneut gesucht werden.
- Browserzugriff setzt voraus, dass die API CORS für die GitHub-Pages-Origin erlaubt. Wenn nicht, zeigt die App einen Fehler. Dann wäre ein kostenloser Proxy/Backend nötig, der separat eingerichtet werden müsste.
- Die Datenquelle beschreibt Angebote, nicht das vollständige Sortiment.

## Update veröffentlichen

1. ZIP entpacken.
2. Alle Dateien und den Ordner `icons` im GitHub-Repository hochladen und überschreiben.
3. `index.html` muss im Repository-Hauptverzeichnis liegen.
4. Änderungen committen. GitHub Pages veröffentlicht die neue Version.
5. Auf Android die App vollständig schließen und erneut öffnen.
