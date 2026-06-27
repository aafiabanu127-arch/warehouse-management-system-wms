// ── Navbar scroll effect ──────────────────────────────────────
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 40);
});

// ── Mobile menu ───────────────────────────────────────────────
function toggleMenu() {
  document.getElementById('mobile-menu').classList.toggle('open');
}
function closeMenu() {
  document.getElementById('mobile-menu').classList.remove('open');
}

// ── Navbar redirect helper ────────────────────────────────────
function goTo(page) {
  window.location.href = page;
}

// ── Count-up animation ────────────────────────────────────────
function animateCount(el) {
  const target = parseInt(el.dataset.target);
  const duration = 1800;
  const step = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(current) + (el.dataset.suffix || '');
  }, 16);
}

// ── Intersection Observer ─────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    // Count-up
    if (entry.target.classList.contains('stat-num')) {
      animateCount(entry.target);
      observer.unobserve(entry.target);
    }

    // Card slide-in
    if (entry.target.classList.contains('anim-card')) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.stat-num, .anim-card').forEach(el => observer.observe(el));

// ── Smooth scroll for nav anchors ─────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
      closeMenu();
    }
  });
});