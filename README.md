# Trimble Connect Siktkontroll Extension

Dette er et internt verktøy for fagkontroll av siktlinjer mot skilt og objekter i vegmodeller.

## Funksjonalitet
- Setter automatisk øyehøyde og objekthøyde.
- Utfører kollisjonstest mot alle synlige modeller i Trimble Connect.
- Tegner rød linje ved siktbrudd og grønn ved fri sikt.

## Installasjon
1. Last opp filene til en HTTPS-server.
2. Gå til Trimble Connect (Web) -> Settings -> Extensions.
3. Legg til ny Extension og lim inn URL-en til `index.html`.
4. Åpne en 3D-modell, og utvidelsen vil dukke opp i sidepanelet.

## API-dokumentasjon
Utvidelsen bruker [Trimble Connect Workspace API](https://www.npmjs.com/package/@trimble-oss/trimble-connect-workspace-api).