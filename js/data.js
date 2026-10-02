// Airtable API configuration : c'est avec ca que je peux faire le lien avec Airtable pour recuperer les projets
const base_id =  `appT6MxCMM1TOQtJh`;
const table_id = `projects`;
const token = "patIMVurKxlCvdXXD.5280faf7e8793979a73f929dfe704d60dbd4abca8f4dc1d0379c0455ac477565";


let projectItems = [];

// function qui sert à récupérer mes données sur Airtable et de les stocker dans la variable
async function fetchData() 
{
    const response = await fetch(`https://api.airtable.com/v0/${base_id}/${table_id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return await response.json();
}

// function qui sert à récupérer mes données sur Airtable et de les stocker dans la variable au lieu de toujours les écrire dans le code
function createElement(tagName, className, textContent) {
    const element = document.createElement(tagName);
    element.className = className;

    if (textContent) {
        element.textContent = textContent;
    }

    return element;
}

// function qui sert à récuperer l'image que j'ai mis dans Airtable
function getProjectImage(project) {

    // Vérifie si le projet a une image définie dans les champs image, imageUrl, cover, images ou Image dans Airtable
    const image = project.image || project.imageUrl || project.cover || project.images || project.Image;

    if (Array.isArray(image)) {
        return image[0]?.thumbnails?.large?.url || image[0]?.url || "";
    }

    if (image) {
        return image;
    }
    // Si aucune image n'est trouvée dans Airtable, utilise une image locale par défaut en fonction du titre du projet
    const localImages = {
        PURGATOIRE: "./assets/images/purgatoire_live_01.jpg",
        ANTRUM: "./assets/images/antrum_projet_video_01.jpg",
        "TOUCHÉ DE LA MORT": "./assets/images/touche_de_la_mort_01.JPG",
        "5686 11E AVENUE": "./assets/images/jeu_vr_main_menu.jpg"
    };

    return localImages[project.title || project.name] || "";
}

// function qui sert à récuperer le titre que j'ai mis dans Airtable
function getProjectTitle(project) {
    return project.title || project.name || "Projet sans titre";
}

// function qui sert à récupérer la description que j'ai mis dans Airtable
function getProjectDescription(project) {
    return project.description || "Découvrez ce projet dans le portfolio. Cette réalisation présente mon approche de la vidéo, de l’animation et de la création visuelle.";
}

// function qui sert à récupérer la description détaillée que j'ai mis dans Airtable
function getProjectExtraDescription(project) {
    return project.detail || project.longDescription || project.details || project.subtitle || project.summary || "";
}

// function qui sert à récupérer la vidéo que j'ai mis dans Airtable
function getProjectVideoUrl(project) {
    return project.video || "";
}

// function qui sert à récupérer l'URL de la vidéo que j'ai mis dans Airtable
function getYouTubeEmbedUrl(videoUrl) {
    const normalizedUrl = String(videoUrl).trim();

    if (/youtube\.com\/embed\//i.test(normalizedUrl)) {
        return normalizedUrl;
    }

    try {
        const parsedUrl = new URL(normalizedUrl);
        const host = parsedUrl.hostname.replace(/^www\./, "");
        let videoId = "";

        if (host === "youtu.be") {
            videoId = parsedUrl.pathname.split("/").filter(Boolean)[0] || "";
        } else if (host.endsWith("youtube.com")) {
            videoId = parsedUrl.searchParams.get("v") || "";

            if (!videoId && parsedUrl.pathname.startsWith("/shorts/")) {
                videoId = parsedUrl.pathname.split("/")[2] || "";
            }
        }

        return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : "";
    } catch (error) {
        return "";
    }
}

// function qui sert à récuperer les technologies que j'ai mis dans Airtable
function getProjectTechnologies(project) {
    const technologies = project.technologies || project.category || project.type || "";

    if (Array.isArray(technologies)) {
        return technologies.filter(Boolean);
    }

    return String(technologies)
        .split(",")
        .map((technology) => technology.trim())
        .filter(Boolean);
}

// function qui sert à récuperer la description que j'ai mis dans Airtable
function createProjectCard(project, index) {

    // Récupération des données du projet
    const fields = project.fields || project;
    const projectId = Number(fields.id || project.id || index + 1);
    const cardColor = projectId === 2 || projectId === 3 ? "red" : "green";
    const card = createElement("article", `project-card project-card--${cardColor}`);
    const button = createElement("button", "project-card__button");
    const title = getProjectTitle(fields);
    const technologyList = getProjectTechnologies(fields);
    const imageUrl = getProjectImage(fields);

    card.dataset.projectId = projectId;
    card.dataset.projectIndex = String(index);

    // Configuration du bouton pour ouvrir le modal
    button.type = "button";
    button.setAttribute("aria-label", `Ouvrir le projet ${title} dans un popup`);
    button.setAttribute("aria-haspopup", "dialog");

    // Création de l'en-tête du projet avec le titre et les technologies
    const header = createElement("header", "project-card__header");
    header.appendChild(createElement("h3", "project-card__title", title));

    const tags = createElement("div", "project-card__tags");
    technologyList.forEach((technology) => {
        tags.appendChild(createElement("span", "project-card__tag", technology));
    });
    header.appendChild(tags);
    button.appendChild(header);

    // Création de l'image du projet si elle existe sur mon Airtable 
    if (imageUrl) {
        const media = createElement("figure", "project-card__media");
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = fields.imageAlt || `Image du projet ${title}`;
        media.appendChild(image);
        button.appendChild(media);
    }
    card.appendChild(button);

    return card;
}

// function qui sert à créer la section des projets 
function createProjectsSection() {
    //Crée la section des projets avec un titre et un conteneur pour les cartes de projet
    const section = createElement("section", "projects-grid");
    section.id = "projets";
    section.setAttribute("aria-labelledby", "projects-title");
    // Crée le titre de la section des projets
    const title = createElement("h2", "projects-grid__title", "PROJETS");
    title.id = "projects-title";
    section.appendChild(title);

    return section;
}

// function qui sert à initialiser le code pour que tout fonctionne bien
async function init() 
{
    // Ajoute un effet de rotation aux cartes de projet lorsque la souris se déplace dessus
    const main = document.querySelector("main");
    if (!main) {
        return;
    }

    let projectsArray = [];
    let projects = { records: [] };

    // Récupère les données des projets depuis Airtable et les garde dans la variable projects
    try {
        projects = await fetchData();
    } catch (error) {
        console.error("Impossible de charger les projets depuis Airtable.", error);
    }

    const projectsGrid = document.querySelector(".projects-grid") || createProjectsSection();

    if (!document.querySelector(".projects-grid")) {
        main.insertBefore(projectsGrid, document.querySelector(".about-section"));
    }

    (projects.records || []).forEach((project, index) => {
        projectsArray.push({
            ...project,
            fields: project.fields || project,
            sortId: Number((project.fields || project).id || index + 1)
        });
    });

    projectsArray.sort((a, b) => a.sortId - b.sortId);
    projectItems = projectsArray;
    projectsGrid.querySelectorAll(".project-card").forEach((projectCard) => projectCard.remove());

    projectsArray.forEach((project, index) => {
        const projectCard = createProjectCard(project, index);
        projectsGrid.appendChild(projectCard);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}