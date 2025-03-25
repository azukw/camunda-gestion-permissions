import { Client, logger, Variables } from "camunda-external-task-client-js";
import axios from "axios"; // Import de la librairie HTTP

// config du client Camunda
const config = { baseUrl: "http://localhost:8080/engine-rest", use: logger };
const client = new Client(config);

// param GitLab
const GITLAB_TOKEN = "TON TOKEN";
const PROJECT_ID = "3472737";
const GITLAB_API_URL = `https://gitlab.com/api/v4/projects/${PROJECT_ID}/members/all`;

const accessLevels = {
    10: "Guest",
    20: "Reporter",
    30: "Developer",
    40: "Maintainer",
    50: "Owner"
};

client.subscribe("extraireDroits", async function ({ task, taskService }) {
    try {
        // API GitLab pour récupérer les membres du projet
        const response = await axios.get(GITLAB_API_URL, {
            headers: { Authorization: `Bearer ${GITLAB_TOKEN}` } 
        });

        // on prend des permissions
        const permissions = response.data.map(member => {
            return `${member.username} - ${accessLevels[member.access_level] || "Unknown"}`;
        }).join("\n");

        // mettre dans le form
        const processVariables = new Variables();
        processVariables.set("cle_permissions", permissions);

        // finir la tache
        await taskService.complete(task, processVariables);

        console.log("Permissions GitLab récupérées et stockées.");
    } catch (error) {
        console.error("Erreur lors de la récupération des permissions:", error);
    }
});
