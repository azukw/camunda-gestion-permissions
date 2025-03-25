import { Client, logger, Variables } from "camunda-external-task-client-js";
import axios from "axios";
import fs from "fs";

// config Camunda
const config = { baseUrl: "http://localhost:8080/engine-rest", use: logger };
const client = new Client(config);

// API Gemini
const GEMINI_API_KEY = "TON TOKEN";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;


// read droitBase.txt
function lireBasePermissions() {
    try {
        return fs.readFileSync("./droitsBase.txt", "utf8");
    } catch (error) {
        console.error("Erreur lors de la lecture de droitsBase.txt:", error);
        return null;
    }
}

client.subscribe("revoirDroits", async function ({ task, taskService }) {
    try {
        // permissions du fichier droitsBase.txt
        const basePermissions = lireBasePermissions();
        if (!basePermissions) {
            throw new Error("Impossible de lire le fichier droitsBase.txt");
        }

        // permissions GitLab
        const permissionsText = task.variables.get("cle_permissions");

        const prompt = `
Voici la liste des permissions actuelles à d'un projet GitLab :

${permissionsText}

Compare-les avec les permissions officielles fournies dans ce fichier :

${basePermissions}

SI ELLES CORRESPONDENT TOUTES, répond SEULEMENT "Tout est correct.".
SI ELLES NE CORRESPONDENT PAS TOUTES, réponds en écrivant ligne par ligne sous la forme "'Nom d'utilisateur' devrait être 'Niveau d'accès qu'il devrait avoir'".
`;

        // console.log("Prompt envoyé à Gemini:\n", prompt);

        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }]
        };
        

        // envoyer à Gemini
        const response = await axios.post(GEMINI_URL, requestBody, {
            headers: { "Content-Type": "application/json" }
        });
        

        // vérif réponse
        if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
            throw new Error("Réponse invalide de Gemini");
        }

        // prend la réponse
        const compteRendu = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Erreur dans la réponse";
        console.log("Compte rendu de Gemini:", compteRendu);

        // si il ya Tout est correct alors erreurs = Non sinon erreurs = Oui
        const erreurs = compteRendu.includes("Tout est correct.") ? "Non" : "Oui";

        // mettre les résultats dans Camunda
        const processVariables = new Variables();
        processVariables.set("erreurs", erreurs);
        processVariables.set("compterendu", compteRendu);

        // finir la tâche
        await taskService.complete(task, processVariables);

        console.log("Vérification des permissions terminée.");
    } catch (error) {
        console.error("Erreur lors de la vérification des permissions:", error.response?.data || error.message);
    }
});
