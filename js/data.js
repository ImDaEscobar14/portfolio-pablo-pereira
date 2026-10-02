// Airtable API configuration : c'est avec ca que je peux faire le lien avec Airtable pour recuperer les projets
const base_id =  `appT6MxCMM1TOQtJh`;
const table_id = `projects`;
const token = "patIMVurKxlCvdXXD.5280faf7e8793979a73f929dfe704d60dbd4abca8f4dc1d0379c0455ac477565";

let projectItems = [];

async function fetchData() 
{
    const response = await fetch(`https://api.airtable.com/v0/${base_id}/${table_id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return await response.json();
}

function createElement(tagName, className, textContent) {
    const element = document.createElement(tagName);
    element.className = className;

    if (textContent) {
        element.textContent = textContent;
    }

    return element;
}

function getProjectImage(project) {
    const image = project.image || project.imageUrl || project.cover || project.images || project.Image;

    if (Array.isArray(image)) {
        return image[0]?.thumbnails?.large?.url || image[0]?.url || "";
    }

    if (image) {
        return image;
    }

    const localImages = {
        PURGATOIRE: "./assets/images/purgatoire_live_01.jpg",
        ANTRUM: "./assets/images/antrum_projet_video_01.jpg",
        "TOUCHÉ DE LA MORT": "./assets/images/touche_de_la_mort_01.JPG",
        "5686 11E AVENUE": "./assets/images/jeu_vr_main_menu.jpg"
    };

    return localImages[project.title || project.name] || "";
}

function getProjectTitle(project) {
    return project.title || project.name || "Projet sans titre";
}

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

function createProjectCard(project, index) {
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
    button.type = "button";
    button.setAttribute("aria-label", `Ouvrir le projet ${title} dans un popup`);
    button.setAttribute("aria-haspopup", "dialog");

    const header = createElement("header", "project-card__header");
    header.appendChild(createElement("h3", "project-card__title", title));

    const tags = createElement("div", "project-card__tags");
    technologyList.forEach((technology) => {
        tags.appendChild(createElement("span", "project-card__tag", technology));
    });
    header.appendChild(tags);
    button.appendChild(header);

    if (imageUrl) {
        const media = createElement("figure", "project-card__media");
        const image = document.createElement("img");
        image.src = imageUrl;
        image.alt = fields.imageAlt || `Image du projet ${title}`;
        media.appendChild(image);
        button.appendChild(media);
    }
    card.appendChild(button);

    button.addEventListener("click", (event) => {
        const clickedMedia = event.target.closest(".project-card__media");

        if (!clickedMedia) {
            return;
        }

        event.preventDefault();
        openProjectModal(index);
    });

    return card;
}

function createProjectsSection() {
    const section = createElement("section", "projects-grid");
    section.id = "projets";
    section.setAttribute("aria-labelledby", "projects-title");

    const title = createElement("h2", "projects-grid__title", "PROJETS");
    title.id = "projects-title";
    section.appendChild(title);

    return section;
}

async function init() 
{
    const main = document.querySelector("main");
    if (!main) {
        return;
    }

    let projectsArray = [];
    let projects = { records: [] };

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