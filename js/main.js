document.addEventListener("DOMContentLoaded", () => {
	const carousel = document.querySelector(".competences-carousel");

	if (!carousel) {
		return;
	}

	const track = carousel.querySelector(".competences-carousel__track");
	const prevButton = carousel.querySelector(".competences-carousel__arrow--prev");
	const nextButton = carousel.querySelector(".competences-carousel__arrow--next");
	const dots = Array.from(carousel.querySelectorAll(".competences-carousel__dot"));

	const originalCards = Array.from(track.querySelectorAll(".competence-card"));
	let slideCount = originalCards.length;
	let clonesPerSide = 0;
	let currentIndex = 0;
	let slideStep = 0;
	let autoplayTimer = null;
	let isAnimating = false;

	const getSlidesPerView = () => (window.matchMedia("(max-width: 760px)").matches ? 1 : 3);

	const clearTrack = () => {
		track.replaceChildren(...originalCards.map((card) => card.cloneNode(true)));
	};

	const updateDots = () => {
		if (!dots.length) {
			return;
		}

		const activeDot = ((currentIndex % slideCount) + slideCount) % slideCount;
		dots.forEach((dot, index) => {
			dot.classList.toggle("competences-carousel__dot--active", index === activeDot);
		});
	};

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

	const moveCarousel = (direction) => {
		if (isAnimating || !slideStep) {
			return;
		}

		isAnimating = true;
		currentIndex += direction;
		track.style.transform = `translateX(${-((clonesPerSide + currentIndex) * slideStep)}px)`;
	};

	const restartAutoplay = () => {
		window.clearInterval(autoplayTimer);
		autoplayTimer = window.setInterval(() => {
			moveCarousel(1);
		}, 3500);
	};

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

	prevButton.addEventListener("click", () => {
		moveCarousel(-1);
		restartAutoplay();
	});

	nextButton.addEventListener("click", () => {
		moveCarousel(1);
		restartAutoplay();
	});

	window.addEventListener("resize", () => {
		buildCarousel();
		restartAutoplay();
	});

	buildCarousel();
	restartAutoplay();
});
