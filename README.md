# Gestion des Permissions Gitlab avec Camunda et Gemini

## Description
J'utilise **Camunda 7** pour automatiser la vérification des droits d'accès d'un projet GitLab. J'ai utilisé deux scripts JavaScript et l'API **Gemini** de Google pour comparer les permissions réelles aux permissions attendues.

## Comment tester

### 1 - Importer et exporter le BPMN
1. Ouvrir **Camunda Modeler**.
2. Importer le fichier `processus_permissions.bpmn` ainsi que les **quatre formulaires** nécessaires.
3. Exporter le tout.

### 2 - Lancer les scripts
Au cas où, avant de lancer les scripts, ne pas oublier d'installer les dépendances :
```sh
#  (Windows)
cd .\workers
npm i 
```

Il faut aussi modifier les tokens dans les fichiers JavaScript (les deux API sont gratuites) :
- Dans `extraireDroits.js`, remplace `const GITLAB_TOKEN = "TON TOKEN";` par ton propre [token GitLab](https://gitlab.com/-/user_settings/personal_access_tokens).
- Dans `revoirDroits.js`, remplace `const GEMINI_API_KEY = "TON TOKEN";` par ton propre [token Gemini](https://aistudio.google.com/app/apikey?hl=fr).

Dans deux terminaux, en étant à la racine du projet :
```sh
#  (Windows)
node .\workers\extraireDroits.js 
```
```sh
#  (Windows)
node .\workers\revoirDroits.js
```

### 3 - Exécuter le processus sur Camunda
1. Aller sur la **tasklist Camunda**.
2. Démarrer un nouveau processus **"permissions"**.

### 4 - Déroulement du processus
1. **`extraireDroits.js`** extrait les droits actuels via l'API GitLab et les envoie à la tâche suivante
2. **`revoirDroits.js`** envoie les permissions à **l'API Gemini** pour comparer avec les permissions officielles définies dans `droitsBase.txt`
3. Selon la réponse de Gemini :
   - Si tout est correct, le processus se termine.
   - S'il y a une erreur, une **vérification humaine** est demandée :
     - **Si l'erreur est grave**, la tâche passe à **"modifications"**.
     - **Sinon**, le processus est terminé.


---

## Rôle du fichier `droitsBase.txt`
- **Les permissions officielles** qui sont censées être sur Gitlab.
- Il est identique aux droits GitLab au début donc on peut faire un test simple : **modifier un rôle dans `droitsBase.txt` et voir comment Gemini détecte l'écart**.
- Si une différence est détectée, Gemini va signaler qu'une maj est nécessaire sur GitLab

## Choix
- **API Gemini** : choisie car elle est gratuite pour la génération de texte
- **GitLab API** : pour extraire les permissions du projet GitLab

