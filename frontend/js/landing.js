// ── Mobile nav toggle ────────────────────────────────────────
const burger    = document.getElementById('nav-burger');
const navMobile = document.getElementById('nav-mobile');

burger.addEventListener('click', () => {
  navMobile.classList.toggle('open');
});

// Close mobile menu when a link is clicked
navMobile.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navMobile.classList.remove('open'));
});

// ── Sticky nav shadow on scroll ──────────────────────────────
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    nav.style.boxShadow = '0 4px 30px rgba(0,0,0,0.4)';
  } else {
    nav.style.boxShadow = 'none';
  }
});

// ── Animated stat counters ───────────────────────────────────
function animateCounter(el, target, duration = 1800) {
  let start     = 0;
  const step    = target / (duration / 16);
  const timer   = setInterval(() => {
    start += step;
    if (start >= target) {
      el.textContent = target + (el.dataset.suffix || '');
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(start) + (el.dataset.suffix || '');
    }
  }, 16);
}

// Trigger counters when stats section enters viewport
const statNums = document.querySelectorAll('.stat-num');
let countersStarted = false;

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !countersStarted) {
      countersStarted = true;
      statNums.forEach(el => {
        const target = parseInt(el.dataset.target || 0);
        animateCounter(el, target);
      });
    }
  });
}, { threshold: 0.3 });

const statsBanner = document.querySelector('.stats-banner');
if (statsBanner) observer.observe(statsBanner);

// ── Scroll reveal for cards ──────────────────────────────────
const revealEls = document.querySelectorAll('.feature-card, .role-card');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity   = '1';
      entry.target.style.transform = 'translateY(0)';
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach(el => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  revealObserver.observe(el);
});

// ── Smooth scroll for anchor links ──────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Redirect if already logged in ───────────────────────────
if (localStorage.getItem('access')) {
  window.location.href = 'dashboard.html';
}