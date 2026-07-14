document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => menu.classList.toggle('hidden'));
  }

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
  }

  document.querySelectorAll('[data-add-to-cart]').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      fd.append('csrf_token', window.APP.csrf);
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Adding…';
      }
      try {
        const res = await fetch(`${window.APP.baseUrl}/api/cart.php`, {
          method: 'POST',
          body: fd,
          credentials: 'same-origin'
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'Could not add to cart');
        const badge = document.getElementById('cart-count');
        if (badge) badge.textContent = data.count;
        const totalEl = document.getElementById('cart-total');
        if (totalEl && data.subtotal) totalEl.textContent = data.subtotal;
        if (btn) btn.textContent = 'Added ✓';
        setTimeout(() => {
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Add to Cart';
          }
        }, 1200);
      } catch (err) {
        alert(err.message);
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Add to Cart';
        }
      }
    });
  });

  const newsletter = document.getElementById('footer-newsletter');
  if (newsletter) {
    newsletter.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(newsletter);
      const res = await fetch(newsletter.action, { method: 'POST', body: fd, credentials: 'same-origin' });
      const data = await res.json();
      alert(data.message || (data.ok ? 'Subscribed!' : 'Something went wrong'));
      if (data.ok) newsletter.reset();
    });
  }

  // Product compare (localStorage-based)
  const COMPARE_KEY = 'cd_compare';
  const COMPARE_MAX = 4;
  const getCompare = () => {
    try { return JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]').map(Number).filter(Boolean); }
    catch (e) { return []; }
  };
  const setCompare = (ids) => localStorage.setItem(COMPARE_KEY, JSON.stringify(ids.slice(0, COMPARE_MAX)));

  const refreshCompareBadge = () => {
    const badge = document.getElementById('compare-count');
    if (!badge) return;
    const n = getCompare().length;
    badge.textContent = n;
    badge.classList.toggle('hidden', n === 0);
  };

  const refreshCompareButtons = () => {
    const ids = getCompare();
    document.querySelectorAll('[data-compare-toggle]').forEach((btn) => {
      const id = Number(btn.getAttribute('data-compare-toggle'));
      const active = ids.includes(id);
      btn.classList.toggle('bg-brand-ink', active);
      btn.classList.toggle('text-white', active);
      btn.classList.toggle('bg-white/90', !active);
      btn.title = active ? 'Remove from compare' : 'Add to compare';
    });
  };

  document.querySelectorAll('[data-compare-toggle]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = Number(btn.getAttribute('data-compare-toggle'));
      let ids = getCompare();
      if (ids.includes(id)) {
        ids = ids.filter((x) => x !== id);
      } else {
        if (ids.length >= COMPARE_MAX) {
          alert(`You can compare up to ${COMPARE_MAX} items.`);
          return;
        }
        ids.push(id);
      }
      setCompare(ids);
      refreshCompareBadge();
      refreshCompareButtons();
    });
  });

  refreshCompareBadge();
  refreshCompareButtons();

  // Compare page: sync URL with saved selection and handle removals
  const comparePage = document.querySelector('[data-compare-page]');
  if (comparePage) {
    const ids = getCompare();
    const params = new URLSearchParams(window.location.search);
    const urlIds = (params.get('ids') || '').split(',').map(Number).filter(Boolean);
    const sameSet = urlIds.length === ids.length && urlIds.every((x) => ids.includes(x));
    if (!sameSet) {
      if (ids.length) {
        params.set('ids', ids.join(','));
        window.location.search = params.toString();
      } else if (urlIds.length) {
        params.delete('ids');
        window.location.search = params.toString();
      }
    }
    comparePage.querySelectorAll('[data-compare-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-compare-remove'));
        setCompare(getCompare().filter((x) => x !== id));
        const left = getCompare();
        const p = new URLSearchParams(window.location.search);
        if (left.length) { p.set('ids', left.join(',')); } else { p.delete('ids'); }
        window.location.search = p.toString();
      });
    });
  }

  // Testimonials rotator
  const slides = document.querySelectorAll('[data-testimonial]');
  const dots = document.querySelectorAll('[data-testimonial-dot]');
  if (slides.length > 1) {
    let i = 0;
    const show = (n) => {
      slides.forEach((s, idx) => s.classList.toggle('hidden', idx !== n));
      dots.forEach((d, idx) => d.classList.toggle('bg-brand-ink', idx === n));
      dots.forEach((d, idx) => d.classList.toggle('bg-brand-ink/20', idx !== n));
    };
    dots.forEach((d, idx) => d.addEventListener('click', () => { i = idx; show(i); }));
    setInterval(() => { i = (i + 1) % slides.length; show(i); }, 5500);
  }
});
