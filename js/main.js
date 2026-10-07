document.addEventListener("DOMContentLoaded", () => {
	document.documentElement.classList.add("js-enabled");

	// Vérifie les préférences d'animation avant d'activer les effets visuels
	const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	let backgroundFrame = null;
	const header = document.querySelector("header");
	const menuToggle = document.querySelector(".header__toggle");
	const navigation = document.querySelector("#main-navigation");
	const mobileMenuQuery = window.matchMedia("(max-width: 760px)");
	const projectCards = new Set();
	const projectCardOrders = new Map();
	let projectCardCounter = 0;
	let projectScrollFrame = null;
	let lastScrollY = window.scrollY;
	let scrollDirection = 1;
	const cardStaggerDuration = 120;

	const applyProjectCardScrollState = (card, isVisible) => {
		const cardOrder = projectCardOrders.get(card) ?? 0;
		const reverseDelay = Math.max(0, (projectCardCounter - cardOrder - 1) * cardStaggerDuration);

		card.style.setProperty("--card-scroll-offset", isVisible ? "0px" : "24px");
		card.style.setProperty("--card-scroll-opacity", isVisible ? "1" : "0");
		card.style.setProperty("--card-scroll-exit-delay", `${reverseDelay}ms`);

		if (isVisible) {
			card.classList.add("project-card--revealed");
			card.classList.remove("project-card--leaving");
			return;
		}

		card.classList.remove("project-card--revealed");
		card.classList.add("project-card--leaving");
	};

	const updateProjectCardScrollState = () => {
		projectScrollFrame = null;

		if (!projectCards.size) {
			return;
		}

		if (prefersReducedMotion) {
			projectCards.forEach((card) => {
				card.style.setProperty("--card-scroll-offset", "0px");
				card.style.setProperty("--card-scroll-opacity", "1");
				card.classList.add("project-card--revealed");
			});
			return;
		}

		const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
		const revealThreshold = viewportHeight * 0.82;
		const hideThreshold = viewportHeight * 0.38;

		projectCards.forEach((card) => {
			if (!(card instanceof HTMLElement)) {
				return;
			}

			const rect = card.getBoundingClientRect();
			const isVisible = scrollDirection >= 0
				? rect.top <= revealThreshold && rect.bottom > 0
				: rect.top <= hideThreshold && rect.bottom > 0;

			applyProjectCardScrollState(card, isVisible);
		});
	};

	const scheduleProjectCardScrollStateUpdate = () => {
		if (projectScrollFrame !== null) {
			return;
		}

		projectScrollFrame = window.requestAnimationFrame(updateProjectCardScrollState);
	};

	const registerProjectCard = (card) => {
		if (!(card instanceof HTMLElement)) {
			return;
		}

		if (!projectCardOrders.has(card)) {
			projectCardOrders.set(card, projectCardCounter);
			card.style.setProperty("--card-scroll-delay", `${projectCardCounter * cardStaggerDuration}ms`);
			projectCardCounter += 1;
		}

		projectCards.add(card);
		scheduleProjectCardScrollStateUpdate();
	};

	const scanForProjectCards = (root) => {
		if (!(root instanceof Element || root instanceof Document)) {
			return;
		}

		if (root instanceof Element && root.matches(".project-card")) {
			registerProjectCard(root);
		}

		root.querySelectorAll?.(".project-card").forEach(registerProjectCard);
	};

	const setupProjectRevealAnimation = () => {
		scanForProjectCards(document);

		const mutationObserver = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					if (!(node instanceof HTMLElement)) {
						return;
					}

					if (node.matches?.(".project-card")) {
						registerProjectCard(node);
						return;
					}

					node.querySelectorAll?.(".project-card").forEach((card) => {
						registerProjectCard(card);
					});
				});
			});
		});

		mutationObserver.observe(document.body, { childList: true, subtree: true });

		window.addEventListener("scroll", () => {
			const currentScrollY = window.scrollY;
			scrollDirection = currentScrollY >= lastScrollY ? 1 : -1;
			lastScrollY = currentScrollY;
			scheduleProjectCardScrollStateUpdate();
		}, { passive: true });

		window.addEventListener("resize", scheduleProjectCardScrollStateUpdate, { passive: true });
		updateProjectCardScrollState();
	};

	setupProjectRevealAnimation();

	const closeMobileMenu = () => {
		if (!header || !menuToggle || !navigation) {
			return;
		}

		header.classList.remove("header--menu-open");
		menuToggle.setAttribute("aria-expanded", "false");
		menuToggle.setAttribute("aria-label", "Ouvrir le menu principal");
		navigation.hidden = true;
	};

	const openMobileMenu = () => {
		if (!header || !menuToggle || !navigation) {
			return;
		}

		header.classList.add("header--menu-open");
		menuToggle.setAttribute("aria-expanded", "true");
		menuToggle.setAttribute("aria-label", "Fermer le menu principal");
		navigation.hidden = false;
	};

	const syncMobileMenuState = (matchesMobile) => {
		if (!header || !menuToggle || !navigation) {
			return;
		}

		if (matchesMobile) {
			closeMobileMenu();
			return;
		}

		navigation.hidden = false;
		header.classList.remove("header--menu-open");
		menuToggle.setAttribute("aria-expanded", "false");
		menuToggle.setAttribute("aria-label", "Ouvrir le menu principal");
	};

	if (menuToggle && navigation) {
		syncMobileMenuState(mobileMenuQuery.matches);

		menuToggle.addEventListener("click", () => {
			if (!mobileMenuQuery.matches) {
				return;
			}

			if (header.classList.contains("header--menu-open")) {
				closeMobileMenu();
				return;
			}

			openMobileMenu();
		});

		navigation.querySelectorAll("a").forEach((link) => {
			link.addEventListener("click", () => {
				if (mobileMenuQuery.matches) {
					closeMobileMenu();
				}
			});
		});

		mobileMenuQuery.addEventListener("change", (event) => {
			syncMobileMenuState(event.matches);
		});
	}

	// Déplace légèrement du background en fonction de la position de la souris
	if (!prefersReducedMotion) {
		window.addEventListener("pointermove", (event) => {
			if (backgroundFrame !== null) {
				return;
			}

			backgroundFrame = window.requestAnimationFrame(() => {
				const horizontalOffset = ((event.clientX / window.innerWidth) - 0.5) * -12;
				const verticalOffset = ((event.clientY / window.innerHeight) - 0.5) * -8;

				document.body.style.setProperty("--background-x", `${horizontalOffset.toFixed(2)}px`);
				document.body.style.setProperty("--background-y", `${verticalOffset.toFixed(2)}px`);
				backgroundFrame = null;
			});
		});
	}

	// Donne un pettit effet 3D aux cartes de projets lorsque la souris les survole
	if (!prefersReducedMotion) {
		document.addEventListener("pointermove", (event) => {
			const card = event.target.closest(".project-card");

			if (!card) {
				return;
			}

			// Calcule la position de la souris par rapport à la carte et applique une rotation en conséquence
			const cardBounds = card.getBoundingClientRect();
			const horizontalPosition = (event.clientX - cardBounds.left) / cardBounds.width - 0.5;
			const verticalPosition = (event.clientY - cardBounds.top) / cardBounds.height - 0.5;

			card.style.setProperty("--card-rotate-x", `${(verticalPosition * -5).toFixed(2)}deg`);
			card.style.setProperty("--card-rotate-y", `${(horizontalPosition * 5).toFixed(2)}deg`);
		});

		document.addEventListener("pointerout", (event) => {
			const card = event.target.closest(".project-card");

			if (!card || card.contains(event.relatedTarget)) {
				return;
			}

			card.style.removeProperty("--card-rotate-x");
			card.style.removeProperty("--card-rotate-y");
		});
	}

	const homeLink = document.querySelector('a[href="#top"]');

	if (homeLink) {
		homeLink.addEventListener("click", (event) => {
			event.preventDefault();
			window.scrollTo({ top: 0, behavior: "smooth" });
		});
	}

	// Récupère les éléments nécessaires au fonctionnement de la carrousel
	const carousel = document.querySelector(".competences-carousel");

	if (!carousel) {
		return;
	}

	const track = carousel.querySelector(".competences-carousel__track");
	const prevButton = carousel.querySelector(".competences-carousel__arrow--prev");
	const nextButton = carousel.querySelector(".competences-carousel__arrow--next");
	const dots = Array.from(carousel.querySelectorAll(".competences-carousel__dot"));

	// Prépare les variables utilisées pour déplacer la carrousel en boucle
	const originalCards = Array.from(track.querySelectorAll(".competence-card"));
	let slideCount = originalCards.length;
	let clonesPerSide = 0;
	let currentIndex = 0;
	let slideStep = 0;
	let autoplayTimer = null;
	let isAnimating = false;

	const getSlidesPerView = () => (window.matchMedia("(max-width: 760px)").matches ? 1 : 3);

	// Réinitialise la piste avec les cartes originales avant de créer les copies
	const clearTrack = () => {
		track.replaceChildren(...originalCards.map((card) => card.cloneNode(true)));
	};

	// Met à jour le point actif selon la carte actuellement affichée
	const updateDots = () => {
		if (!dots.length) {
			return;
		}

		const activeDot = ((currentIndex % slideCount) + slideCount) % slideCount;
		dots.forEach((dot, index) => {
			dot.classList.toggle("competences-carousel__dot--active", index === activeDot);
		});
	};

	// Calcule la distance nécessaire pour passer d'une carte à la suivante
	const measureStep = () => {
		const slide = track.querySelector(".competence-card");

		if (!slide) {
			slideStep = 0;
			return;
		}

		const slideWidth = slide.getBoundingClientRect().width;
		const trackStyle = window.getComputedStyle(track);
		const gap = Number.parseFloat(trackStyle.columnGap || trackStyle.gap || "0") || 0;
		slideStep = slideWidth + gap;
	};

	// Construit la carrousel infinie avec des copies au début et à la fin
	const buildCarousel = () => {
		const slidesPerView = getSlidesPerView();
		clonesPerSide = slideCount;
		currentIndex = 0;

		track.style.transition = "none";
		clearTrack();

		const startClones = originalCards.map((card) => {
			const clone = card.cloneNode(true);
			clone.classList.add("is-clone");
			clone.setAttribute("aria-hidden", "true");
			return clone;
		});

		const endClones = originalCards.map((card) => {
			const clone = card.cloneNode(true);
			clone.classList.add("is-clone");
			clone.setAttribute("aria-hidden", "true");
			return clone;
		});

		track.prepend(...startClones);
		track.append(...endClones);

		measureStep();
		track.style.transform = `translateX(${-clonesPerSide * slideStep}px)`;
		updateDots();

		requestAnimationFrame(() => {
			track.style.transition = "transform 0.55s ease";
		});

		if (slidesPerView === 1) {
			carousel.classList.add("competences-carousel--compact");
		} else {
			carousel.classList.remove("competences-carousel--compact");
		}
	};

	// Déplace la carrousel dans la direction demandée
	const moveCarousel = (direction) => {
		if (isAnimating || !slideStep) {
			return;
		}

		isAnimating = true;
		currentIndex += direction;
		track.style.transform = `translateX(${-((clonesPerSide + currentIndex) * slideStep)}px)`;
	};

	// Relance le défilement automatique après une interaction manuelle
	const restartAutoplay = () => {
		window.clearInterval(autoplayTimer);
		autoplayTimer = window.setInterval(() => {
			moveCarousel(1);
		}, 3500);
	};

	// Replace la carrousel sur les cartes originales lorsqu'une copie est atteinte
	track.addEventListener("transitionend", () => {
		if (currentIndex >= slideCount) {
			currentIndex = 0;
			track.style.transition = "none";
			track.style.transform = `translateX(${-clonesPerSide * slideStep}px)`;
			requestAnimationFrame(() => {
				track.style.transition = "transform 0.55s ease";
				isAnimating = false;
			});
			updateDots();
			return;
		}

		if (currentIndex < 0) {
			currentIndex = slideCount - 1;
			track.style.transition = "none";
			track.style.transform = `translateX(${-((clonesPerSide + currentIndex) * slideStep)}px)`;
			requestAnimationFrame(() => {
				track.style.transition = "transform 0.55s ease";
				isAnimating = false;
			});
			updateDots();
			return;
		}

		isAnimating = false;
		updateDots();
	});

	// Contrôles manuels de la carrousel
	prevButton.addEventListener("click", () => {
		moveCarousel(-1);
		restartAutoplay();
	});

	nextButton.addEventListener("click", () => {
		moveCarousel(1);
		restartAutoplay();
	});

	// Reconstruit la carrousel lorsque la largeur de l'écran change
	window.addEventListener("resize", () => {
		buildCarousel();
		restartAutoplay();
	});

	// Initialise la carrousel et son défilement automatique
	buildCarousel();
	restartAutoplay();
});
