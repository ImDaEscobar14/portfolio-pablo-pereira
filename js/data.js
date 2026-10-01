const base_id =  `appT6MxCMM1TOQtJh`;
const table_id = `projects`;
const token = "patIMVurKxlCvdXXD.5280faf7e8793979a73f929dfe704d60dbd4abca8f4dc1d0379c0455ac477565";

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

function createProjectCard(project, index) {
    const fields = project.fields || project;
    const projectId = Number(fields.id || project.id || index + 1);
    const cardColor = projectId === 2 || projectId === 3 ? "red" : "green";
    const card = createElement("article", `project-card project-card--${cardColor}`);
    const button = createElement("button", "project-card__button");
    const content = createElement("div", "project-card__content");
    const title = fields.title || fields.name || "Projet sans titre";
    const technologies = fields.technologies || fields.category || fields.type || "";
    const technologyList = Array.isArray(technologies)
        ? technologies
        : String(technologies).split(",").map((technology) => technology.trim()).filter(Boolean);
    const description = fields.description || "Découvrez ce projet dans le portfolio. Cette réalisation présente mon approche de la vidéo, de l'animation et de la création visuelle.";
    const imageUrl = getProjectImage(fields);

    card.dataset.projectId = projectId;
    button.type = "button";
    button.setAttribute("aria-expanded", "true");
    button.setAttribute("aria-label", `Masquer les détails du projet ${title}`);
    button.setAttribute("aria-controls", `project-description-${index}`);

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

    const details = createElement("div", "project-card__details");
    details.id = `project-description-${index}`;
    details.hidden = false;
    details.appendChild(createElement("p", "project-card__description", description));
    content.appendChild(details);

    button.appendChild(content);
    card.appendChild(button);

    button.addEventListener("click", () => {
        const isExpanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!isExpanded));
        button.setAttribute("aria-label", `${isExpanded ? "Afficher" : "Masquer"} les détails du projet ${title}`);
        details.hidden = isExpanded;
        card.classList.toggle("project-card--open", !isExpanded);
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

    (projects.records || []).forEach(project => {
        projectsArray.push(project.fields);
    });

    projectsArray.sort((a, b) => a.id - b.id);
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