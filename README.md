# Volvic Deal Finder – kostenlose PWA

Installierbare Web-App für Android (Chrome → „Zum Startbildschirm“ / „App installieren“).

## Was funktioniert
- Anthrazit-, Limettengrün- und Gelb-Design
- Angebotsliste für ausschließlich Volvic Eistee
- Such-PLZ und Umkreis lokal speichern
- Quellenverzeichnis mit allen zehn Händlern
- Direktlinks zu Prospektseiten und Websuche nach Volvic Eistee
- Textprüfung: speichert nur wenn „Volvic“ UND „Eistee“ im Belegtext stehen
- Manuelles Erfassen bestätigter Angebote mit Preis, Zeitraum, Filiale und Beleg-URL
- Speicherung aller Angebote ausschließlich im lokalen Browser-Speicher
- Offline-Cache für die App-Oberfläche

## Ehrliche Funktionsgrenze
Diese kostenlose Version lädt die Prospekte nicht automatisch herunter und durchsucht sie nicht selbstständig im Hintergrund. Die Händlerseiten bieten keine einheitliche, nachweislich frei nutzbare Schnittstelle für alle zehn Ketten. Daher öffnet die App die Quellen und ermöglicht die lokale Erfassung nach Prüfung. Sie erfindet keine Treffer. Das ist noch kein vollautomatischer Angebots-Crawler.

## Installation auf Android
Die PWA muss über HTTPS bereitgestellt werden:
1. Dateien auf einen kostenlosen statischen HTTPS-Host legen (z. B. GitHub Pages).
2. URL in Chrome auf Android öffnen.
3. Menü ⋮ → „App installieren“ oder „Zum Startbildschirm hinzufügen“.

Alternativ kann `index.html` lokal am PC geprüft werden; PWA-Installation und Service Worker funktionieren lokal nicht zuverlässig ohne HTTPS/localhost.

## Händlerquellen
- REWE: https://www.rewe.de/angebote/
- EDEKA: https://www.edeka.de/angebote/
- Kaufland: https://filiale.kaufland.de/prospekte.html
- Lidl: https://www.lidl.de/c/online-prospekte/s10005610
- ALDI Nord: https://www.aldi-nord.de/prospekte.html
- ALDI Süd: https://www.aldi-sued.de/de/angebote.html
- Netto Marken-Discount: https://www.netto-online.de/angebote
- Penny: https://www.penny.de/angebote
- Norma: https://www.norma-online.de/de/angebote
- Globus: https://www.globus.de/maerkte/angebote.php

## Daten
Keine Konten, keine Serverdatenbank, keine Drittanbieter-Analyse. Angebote bleiben auf dem jeweiligen Gerät.
