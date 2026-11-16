# Volvic Deal Finder – automatische Suche (ALDI Süd)

Kostenlose installierbare PWA für Android. Die App sucht beim Öffnen automatisch nach aktiven Volvic-Angeboten. Eine erneute Suche ist über „Jetzt nach Angeboten suchen“ möglich. Erfolgreiche Ergebnisse werden lokal zwischengespeichert; wenn die App erneut geöffnet wird, wird nach 24 Stunden neu gesucht.

## Datenquelle und Händlerabdeckung

Die App verwendet die kostenlose öffentliche API von **PrijsProfeet**:
`https://www.prijsprofeet.de/api/v1/search?q=Volvic&retailer=aldi_sued&page_size=100&promotion_status=active`

Die aktuelle API-Dokumentation weist Deutschland derzeit ausschließlich mit ALDI Süd aus. Die Suche beschränkt sich deshalb auf ALDI Süd. Andere Händler werden in der App als noch nicht angebunden angezeigt; es werden keine Angebote erfunden.

PrijsProfeet verlangt bei kostenloser Nutzung eine sichtbare Quellenangabe. Diese ist in der App mit Link enthalten. Die API-Daten sind indikativ und sollen beim Händler geprüft werden.

## Grenzen

- Keine PLZ-/Umkreissuche: Die deutsche API liefert für diese Angebote keine verlässlichen Filialkoordinaten oder Filialadressen. Deshalb zeigt die App keine erfundenen Filialen oder Entfernungen.
- Kein verlässlicher Hintergrundlauf, wenn die App geschlossen ist. Die Suche erfolgt beim Öffnen und höchstens einmal pro 24 Stunden automatisch, oder jederzeit manuell über die Schaltfläche.
- Die App zeigt nur aktive Volvic-Angebote mit Preis. Verfügbarkeit und Gültigkeit richten sich nach den API-Angaben.
- Der Browser muss den API-Zugriff erlauben (CORS). Falls die API den Browserzugriff blockiert oder nicht erreichbar ist, zeigt die App einen Fehler und gegebenenfalls die zuletzt gespeicherten Treffer.

## Veröffentlichung auf GitHub Pages

1. ZIP entpacken.
2. Alle Dateien und den Ordner `icons` im Repository hochladen und vorhandene Dateien überschreiben.
3. `index.html` muss direkt im Repository-Hauptverzeichnis liegen.
4. Änderungen committen. GitHub Pages veröffentlicht die aktualisierte PWA automatisch.

Nach dem Update die App auf Android einmal vollständig schließen und erneut öffnen. Falls sie noch die alte Oberfläche zeigt, im Chrome-Menü die Website neu laden.

## Installation

Die App über GitHub Pages (HTTPS) in Chrome öffnen und „App installieren“ / „Zum Startbildschirm hinzufügen“ wählen.
