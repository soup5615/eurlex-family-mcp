# Installation locale d'eurlex-family

Choisissez votre méthode :

| Méthode | Pré-requis | Avertissement Apple/Windows ? | Recommandé pour |
|---|---|---|---|
| **🐳 Docker (recommandé)** | Docker Desktop (signé Docker Inc) | **Non** | Tout le monde |
| 🟢 Node.js | Node.js 20+ | Oui sur Mac/Windows (1× au premier lancement) | Développeurs |

---

## 🐳 Méthode A — Docker (zéro alerte, zéro compilation)

### A.1. Installer Docker Desktop (une seule fois)

Allez sur **[docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)**.
- **Mac** : téléchargez Docker.dmg, ouvrez-le, glissez l'icône dans Applications.
- **Windows** : téléchargez Docker Desktop Installer.exe, double-cliquez, suivez l'assistant.
- **Linux** : installez Docker Engine + le plugin compose via votre gestionnaire de paquets.

> Docker Desktop est **signé numériquement par Docker Inc.** — pas d'alerte « non vérifié » sur Mac. C'est la seule installation système qu'il vous reste à faire.

Lancez Docker Desktop une fois et attendez que l'icône (baleine) indique « Docker Desktop is running ».

### A.2. Télécharger ce projet

Sur **[github.com/soup5615/eurlex-family-mcp](https://github.com/soup5615/eurlex-family-mcp)**, sélectionnez la branche **`claude/succession-law-software-0YUMr`**, puis bouton **« Code » → « Download ZIP »**. Décompressez où vous voulez.

### A.3. Double-cliquer

Dans le dossier décompressé :
- **Mac/Linux** : double-cliquez sur **`start-docker.command`**
- **Windows** : double-cliquez sur **`start-docker.bat`**

L'image se construit (~1-2 min la première fois), le conteneur démarre, votre navigateur s'ouvre automatiquement sur **http://localhost:4050**.

### A.4. Pour arrêter
- Mac/Linux : double-clic sur **`stop-docker.command`**
- Windows : double-clic sur **`stop-docker.bat`**

Vos cas restent dans le dossier `data/` à côté du script. Pour relancer, re-double-cliquez sur le script de démarrage. Les fois suivantes, l'image est en cache → ~5 secondes.

---

## 🟢 Méthode B — Node.js (sans Docker)

Plus léger en disque mais déclenche l'avertissement macOS Gatekeeper / Windows SmartScreen au premier lancement (à contourner par clic droit → Ouvrir).

### B.1. Installer Node.js (une seule fois)
[nodejs.org](https://nodejs.org/fr/) → version « LTS » → installeur classique.

### B.2. Télécharger le ZIP du projet (idem A.2).

### B.3. Lancer
- **Mac** : **clic droit** sur `start.command` → **« Ouvrir »** → confirmez. (Double-clic les fois suivantes.)
- **Windows** : double-clic sur `start.bat` (puis « Informations complémentaires » → « Exécuter quand même » la première fois).
- **Linux** : `./start.sh` ou double-clic.

Le script vérifie Node.js, installe les dépendances la première fois (~30-60 s), compile, démarre le serveur, ouvre le navigateur.

---

## Avertissement Apple « ne peut pas être ouvert »

Vous voyez cette alerte au premier lancement de `start.command` ou `start.bat` parce que les scripts ne sont pas signés avec un certificat Apple/Microsoft (qui coûte ~99 €/an et n'est pas appliqué à ce logiciel libre).

**3 solutions, par ordre de simplicité** :

1. **Utilisez la méthode Docker** (ci-dessus) — Docker Desktop EST signé, donc plus aucune alerte ensuite.
2. **Clic droit → Ouvrir** sur le script (au lieu de double-clic) → bouton « Ouvrir » dans la nouvelle fenêtre. Une seule fois.
3. **Réglages Système → Confidentialité et sécurité** → en bas, « Ouvrir quand même ».

---

## Configuration

| Variable | Défaut | Description |
|---|---|---|
| `PORT` | `4050` | Port d'écoute |
| `HOST` | `127.0.0.1` (Node) / `0.0.0.0` (Docker) | Adresse |
| `DATA_PATH` | `./data/cases.json` | Fichier des cas |
| `CHROME_PATH` | détection auto | Chemin Chrome (PDF) |

Exemple Mac/Linux :
```
PORT=8080 ./start.command
```

---

## Premier usage

1. Créez un compte (le **premier** est admin).
2. Allez dans **« Cabinet… »** pour configurer votre identité (logo, nom, adresse, auteur).
3. Choisissez un onglet (Successions, Régime matrimonial, etc.) ou chargez un modèle prêt à l'emploi.
4. Renseignez les faits → **Analyser**.
5. **Note HTML** ou **PDF** pour télécharger le rendu (page de garde brandée, page d'avertissement, raisonnement article par article, sources & doctrine).

---

## Avertissement juridique

⚠️ **Cet outil ne constitue pas un conseil juridique.** Les analyses sont rédigées à partir de la connaissance d'un modèle de langage et n'ont pas été validées par un universitaire ou un praticien spécialisé en droit international privé de la famille. Toute conclusion doit être vérifiée auprès des textes officiels (EUR-Lex, curia.europa.eu, HCCH) et de la doctrine canonique avant tout usage en dossier.
