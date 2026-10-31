# App-Icons

Bildmarke auf `tiefwasser` (#0F3D4C) mit Bögen in `aqua`, grünem Bereich in `blattgruen` und hellem Zeiger.

- `app-icon.svg`: Master mit Radius 22 %; `app-icon-192.png` und `app-icon-512.png` daraus, Manifest `"purpose": "any"`.
- `app-icon-maskable.svg` und `app-icon-maskable-512.png`: vollflächig, Bildmarke in der Sicherheitszone (80 %), Manifest `"purpose": "maskable"`; Android schneidet daraus die Form des Homescreens.
- `app-icon-hell.svg`: helle Variante für Präsentationen und Dokumente, nicht als Home-Bildschirm-Icon.
- `favicon.svg` und `favicon-32.png`: Browser-Tab.

Hydrovisor wird nur für Android umgesetzt; Icons für iOS (Apple-Touch-Icon) sind bewusst nicht Teil des Systems.
