# Installation locale d'eurlex-family

Trois étapes. Aucune ligne de commande pour l'usage courant — un simple double-clic.

---

## Étape 1. Installer Node.js (une seule fois)

Allez sur [nodejs.org](https://nodejs.org/fr/) et téléchargez la version « LTS » (recommandée).

- **Mac** : ouvrez le `.pkg`, cliquez « Continuer » jusqu'à la fin.
- **Windows** : ouvrez le `.msi`, cliquez « Suivant » jusqu'à la fin.
- **Linux** : votre gestionnaire de paquets (`apt install nodejs npm` sur Ubuntu/Debian, etc.) ou [nodejs.org](https://nodejs.org/fr/).

> Pour les PDF : installez aussi [Google Chrome](https://www.google.com/chrome/) ou [Chromium](https://www.chromium.org/getting-involved/download-chromium/). Sans Chrome, vous pouvez quand même télécharger les notes en HTML (et les imprimer en PDF depuis votre navigateur).

---

## Étape 2. Télécharger l'application

1. Allez sur la page du projet :
   `https://github.com/soup5615/eurlex-family-mcp`
2. Cliquez sur le bouton vert **« Code »**, puis **« Download ZIP »**.
3. Décompressez le fichier ZIP où vous voulez (Bureau, Documents, etc.).

> Vous devez vous assurer d'être sur la branche `claude/succession-law-software-0YUMr`. Sur GitHub : cliquez sur le sélecteur de branche en haut à gauche de la liste de fichiers, choisissez cette branche, puis cliquez sur « Code » → « Download ZIP ».

---

## Étape 3. Lancer l'application

Allez dans le dossier décompressé.

- **Mac** : double-cliquez sur **`start.command`**.
  - La première fois, macOS peut bloquer le script. Faites alors **clic droit** → **Ouvrir** → confirmez « Ouvrir ».
- **Windows** : double-cliquez sur **`start.bat`**.
  - SmartScreen peut afficher un avertissement la première fois. Cliquez sur « Informations complémentaires » → « Exécuter quand même ».
- **Linux** : double-cliquez sur **`start.sh`**, ou lancez `./start.sh` dans un terminal.

Une fenêtre noire s'ouvre, fait défiler quelques messages d'installation **à la première exécution seulement** (30-60 secondes), puis votre navigateur s'ouvre automatiquement sur :

```
http://localhost:4050
```

C'est l'application. Vous pouvez créer un compte (le premier compte est administrateur) et commencer.

---

## Pour arrêter l'application

- **Mac / Linux** : revenez à la fenêtre Terminal et appuyez sur `Ctrl+C`, ou fermez la fenêtre.
- **Windows** : fermez la fenêtre noire (l'invite de commandes).

Vos cas restent enregistrés dans le dossier `data/` à côté du script. Pour relancer plus tard, double-cliquez à nouveau sur le script de démarrage.

---

## Problèmes courants

**« Node.js n'est pas installé »** — vous avez sauté l'étape 1. Installez Node.js depuis nodejs.org puis relancez.

**Le navigateur ne s'ouvre pas tout seul** — ouvrez votre navigateur et tapez `http://localhost:4050` dans la barre d'adresse.

**Erreur sur Mac « start.command ne peut pas être ouvert »** — clic droit → Ouvrir → confirmez. macOS demande une seule fois.

**SmartScreen bloque sur Windows** — le script n'est pas signé numériquement (logiciel libre). Cliquez « Informations complémentaires » → « Exécuter quand même ». Vous pouvez vérifier le contenu du fichier `start.bat` dans un éditeur de texte ; c'est un script lisible.

**Le port 4050 est déjà pris** — lancez avec un autre port. En terminal :
```
PORT=4060 ./start.command       # Mac/Linux
set PORT=4060 && start.bat      # Windows
```

**Génération PDF impossible** — vérifiez que Chrome/Chromium est installé, ou définissez `CHROME_PATH` :
```
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" ./start.command
```

---

## Avertissement juridique

⚠️ **Cet outil ne constitue pas un conseil juridique.** Les analyses sont rédigées à partir de la connaissance d'un modèle de langage et n'ont pas été validées par un universitaire ou un praticien spécialisé en droit international privé de la famille. Toute conclusion doit être vérifiée auprès des textes officiels (EUR-Lex, curia.europa.eu, HCCH) et de la doctrine canonique avant tout usage en dossier.
