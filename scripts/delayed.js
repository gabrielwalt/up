// add delayed functionality here

// ===== FADE-IN-UP SCROLL ANIMATION =====
// Observes sections with the .fade-in-up class and adds .visible when they enter the viewport.
const fadeInSections = document.querySelectorAll('main > .section.fade-in-up');
if (fadeInSections.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0 },
  );
  fadeInSections.forEach((section) => observer.observe(section));
}
