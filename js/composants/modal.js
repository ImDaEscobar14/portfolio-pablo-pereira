let projectModal = null;
let projectModalElements = null;
let currentProjectIndex = 0;

function getProjectDescription(project) {
	return project.description || "Découvrez ce projet dans le portfolio. Cette réalisation présente mon approche de la vidéo, de l’animation et de la création visuelle.";
}

function getProjectExtraDescription(project) {
	return project.detail || project.longDescription || project.details || project.subtitle || project.summary || "";
}

function getProjectVideoUrl(project) {
	return project.video || "";
}

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

function createProjectModal() {
	const dialog = createElement("dialog", "project-modal");
	const panel = createElement("div", "project-modal__panel");
	const closeButton = createElement("button", "project-modal__close", "×");
	const body = createElement("div", "project-modal__body");
	const media = createElement("figure", "project-modal__media");
	const image = document.createElement("img");
	const content = createElement("div", "project-modal__content");
	const title = createElement("h3", "project-modal__title");
	const description = createElement("p", "project-modal__description");
	const videoSection = createElement("section", "project-modal__section project-modal__section--video");
	const videoTitle = createElement("h4", "project-modal__section-title", "Vidéo du projet");
	const video = createElement("div", "project-modal__video");
	const descriptionSection = createElement("section", "project-modal__section project-modal__section--details");
	const descriptionTitle = createElement("h4", "project-modal__section-title", "Description détaillée");
	const extraDescription = createElement("div", "project-modal__extra-description");
	const meta = createElement("div", "project-modal__meta");
	const metaLabel = createElement("p", "project-modal__meta-label", "Technologies");
	const tags = createElement("div", "project-modal__tags");
	const footer = createElement("div", "project-modal__footer");
	const prevButton = createElement("button", "project-modal__nav-button project-modal__nav-button--prev", "←");
	const counter = createElement("span", "project-modal__counter");
	const nextButton = createElement("button", "project-modal__nav-button project-modal__nav-button--next", "→");

	closeButton.type = "button";
	closeButton.setAttribute("aria-label", "Fermer le popup");
	prevButton.type = "button";
	prevButton.setAttribute("aria-label", "Projet précédent");
	nextButton.type = "button";
	nextButton.setAttribute("aria-label", "Projet suivant");
	image.alt = "";

	meta.appendChild(metaLabel);
	meta.appendChild(tags);
	media.appendChild(image);
	content.appendChild(title);
	content.appendChild(description);
	videoSection.appendChild(videoTitle);
	videoSection.appendChild(video);
	descriptionSection.appendChild(descriptionTitle);
	descriptionSection.appendChild(extraDescription);
	content.appendChild(meta);
	content.appendChild(videoSection);
	content.appendChild(descriptionSection);
	body.appendChild(media);
	body.appendChild(content);
	footer.appendChild(prevButton);
	footer.appendChild(counter);
	footer.appendChild(nextButton);
	panel.appendChild(closeButton);
	panel.appendChild(body);
	panel.appendChild(footer);
	dialog.appendChild(panel);

	projectModalElements = {
		panel,
		image,
		video,
		title,
		description,
		extraDescription,
		videoSection,
		descriptionSection,
		tags,
		counter,
		prevButton,
		nextButton
	};

	closeButton.addEventListener("click", () => {
		dialog.close();
	});

	prevButton.addEventListener("click", () => {
		openProjectModal(currentProjectIndex - 1);
	});

	nextButton.addEventListener("click", () => {
		openProjectModal(currentProjectIndex + 1);
	});

	dialog.addEventListener("click", (event) => {
		if (event.target === dialog) {
			dialog.close();
		}
	});

	dialog.addEventListener("close", () => {
		document.body.classList.remove("project-modal-open");
		document.documentElement.classList.remove("project-modal-open");
	});

	return dialog;
}

function renderProjectModal(projectIndex) {
	if (!projectItems.length || !projectModalElements) {
		return;
	}

	projectModalElements.panel.scrollTop = 0;

	currentProjectIndex = ((projectIndex % projectItems.length) + projectItems.length) % projectItems.length;
	const project = projectItems[currentProjectIndex];
	const fields = project.fields || project;
	const title = getProjectTitle(fields);
	const description = getProjectDescription(fields);
	const extraDescription = getProjectExtraDescription(fields);
	const imageUrl = getProjectImage(fields);
	const videoUrl = getProjectVideoUrl(fields);
	const technologyList = getProjectTechnologies(fields);

	projectModalElements.title.textContent = title;
	projectModalElements.description.textContent = description;
	projectModalElements.extraDescription.replaceChildren();
	projectModalElements.image.src = imageUrl;
	projectModalElements.image.alt = fields.imageAlt || `Image du projet ${title}`;
	projectModalElements.counter.textContent = `${currentProjectIndex + 1} / ${projectItems.length}`;
	projectModalElements.tags.replaceChildren();

	if (extraDescription) {
		const paragraphs = String(extraDescription)
			.split(/\n+/)
			.map((text) => text.trim())
			.filter(Boolean);

		paragraphs.forEach((paragraph) => {
			projectModalElements.extraDescription.appendChild(createElement("p", "project-modal__extra-text", paragraph));
		});
	}

	projectModalElements.video.replaceChildren();
	projectModalElements.videoSection.hidden = false;
	projectModalElements.descriptionSection.hidden = false;

	if (videoUrl) {
		const normalizedUrl = String(videoUrl).trim();

		if (/youtube\.com|youtu\.be/i.test(normalizedUrl)) {
			const iframe = document.createElement("iframe");
			iframe.src = getYouTubeEmbedUrl(normalizedUrl) || normalizedUrl;
			iframe.title = `Vidéo du projet ${title}`;
			iframe.loading = "lazy";
			iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
			iframe.allowFullscreen = true;
			projectModalElements.video.appendChild(iframe);
		} else if (/vimeo\.com/i.test(normalizedUrl)) {
			const iframe = document.createElement("iframe");
			iframe.src = normalizedUrl.includes("player.vimeo.com") ? normalizedUrl : normalizedUrl.replace("vimeo.com", "player.vimeo.com/video");
			iframe.title = `Vidéo du projet ${title}`;
			iframe.loading = "lazy";
			iframe.allow = "autoplay; fullscreen; picture-in-picture";
			iframe.allowFullscreen = true;
			projectModalElements.video.appendChild(iframe);
		} else if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(normalizedUrl)) {
			const videoElement = document.createElement("video");
			videoElement.controls = true;
			videoElement.playsInline = true;
			videoElement.src = normalizedUrl;
			projectModalElements.video.appendChild(videoElement);
		} else {
			const link = document.createElement("a");
			link.href = normalizedUrl;
			link.target = "_blank";
			link.rel = "noreferrer";
			link.textContent = "Voir la vidéo du projet";
			projectModalElements.video.appendChild(link);
		}
	} else {
		projectModalElements.video.appendChild(createElement("p", "project-modal__video-placeholder", "Ajoute une URL de vidéo dans Airtable avec un champ videoUrl, youtubeUrl ou vimeoUrl pour l’afficher ici."));
	}

	if (!extraDescription) {
		projectModalElements.descriptionSection.hidden = true;
	}

	if (technologyList.length === 0) {
		projectModalElements.tags.appendChild(createElement("span", "project-modal__tag", "Aucune technologie indiquée"));
	} else {
		technologyList.forEach((technology) => {
			projectModalElements.tags.appendChild(createElement("span", "project-modal__tag", technology));
		});
	}
}

function openProjectModal(projectIndex) {
	if (!projectModal) {
		projectModal = createProjectModal();
		document.body.appendChild(projectModal);
	}

	renderProjectModal(projectIndex);

	document.body.classList.add("project-modal-open");
	document.documentElement.classList.add("project-modal-open");
	if (!projectModal.open) {
		projectModal.showModal();
	}
}
