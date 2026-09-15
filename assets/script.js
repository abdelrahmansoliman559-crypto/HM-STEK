/* =========================================================
   STEK — shared interactions
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Navbar: hide on scroll down, show on scroll up ---------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 30);

      if (y > lastY && y > 140) {
        nav.classList.add('nav-hidden');   // scrolling down
      } else {
        nav.classList.remove('nav-hidden'); // scrolling up or near top
      }
      lastY = y;
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    });
  }

  /* ---------- Mobile menu ---------- */
  const burger = document.querySelector('.nav-burger');
  const navLinks = document.querySelector('.nav-links');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a:not(.nav-top-link)').forEach(a => {
      a.addEventListener('click', () => {
        burger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
    // mobile dropdown toggle
    document.querySelectorAll('.has-dropdown > .nav-top-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (window.innerWidth <= 980) {
          e.preventDefault();
          btn.parentElement.classList.toggle('open');
        }
      });
    });
  }

  /* ---------- Reveal on scroll (single orchestrated fade-up) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const decimals = el.dataset.count.includes('.') ? 1 : 0;
      const duration = 1600;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = decimals ? val.toFixed(1) : Math.round(val);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = decimals ? target.toFixed(1) : target;
      };
      requestAnimationFrame(step);
    };
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          io2.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => io2.observe(c));
  }

  /* ---------- Forms: validation + FormSubmit email delivery ---------- */
  const phoneRegex = /^[0-9]{9,10}$/;

  const showError = (field, msg) => {
    field.classList.add('invalid');
    const err = field.querySelector('.error');
    if (err) err.textContent = msg;
  };
  const clearError = (field) => field.classList.remove('invalid');

  document.querySelectorAll('form[data-validate]').forEach(form => {
    const status = form.querySelector('.form-status');

    form.addEventListener('submit', (e) => {
      let valid = true;

      form.querySelectorAll('.field[data-required]').forEach(field => {
        const input = field.querySelector('input,select,textarea');
        if (!input) return;
        clearError(field);

        if (!input.value.trim()) {
          showError(field, 'هذا الحقل مطلوب');
          valid = false;
          return;
        }
        if (input.type === 'email' && input.value) {
          const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
          if (!emailOk) { showError(field, 'صيغة البريد الإلكتروني غير صحيحة'); valid = false; }
        }
        if (input.dataset.phone !== undefined) {
          if (!phoneRegex.test(input.value.trim())) {
            showError(field, 'الرجاء إدخال أرقام فقط (٩ إلى ١٠ أرقام) بدون حروف أو رموز');
            valid = false;
          }
        }
      });

      if (!valid) {
        e.preventDefault();
        if (status) {
          status.textContent = 'برجاء مراجعة الحقول المميزة باللون الأحمر.';
          status.className = 'form-status show bad';
        }
        return;
      }

      // Let the form submit normally to FormSubmit (or show local confirmation if no action set)
      if (!form.action || form.action.includes('#')) {
        e.preventDefault();
        if (status) {
          status.textContent = 'تم استلام طلبك بنجاح، سيتواصل معك فريقنا قريبًا.';
          status.className = 'form-status show ok';
        }
        form.reset();
      } else if (status) {
        status.textContent = 'جارِ إرسال طلبك...';
        status.className = 'form-status show ok';
      }
    });

    // phone field: strip non-digits live
    form.querySelectorAll('input[data-phone]').forEach(input => {
      input.addEventListener('input', () => {
        input.value = input.value.replace(/[^0-9]/g, '');
      });
    });

    // clear individual field error on interaction
    form.querySelectorAll('.field input,.field select,.field textarea').forEach(el => {
      el.addEventListener('input', () => el.closest('.field').classList.remove('invalid'));
      el.addEventListener('change', () => el.closest('.field').classList.remove('invalid'));
    });
  });

  /* ---------- Branches directory: live search by city / district ---------- */
  const branchSearch = document.querySelector('#branchSearch');
  if (branchSearch) {
    const cards = document.querySelectorAll('.branch-card');
    const countEl = document.querySelector('.search-count');
    const noResults = document.querySelector('.no-results');

    const filterBranches = () => {
      const q = branchSearch.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach(card => {
        const haystack = (card.dataset.search || '').toLowerCase();
        const match = !q || haystack.includes(q);
        card.classList.toggle('no-match', !match);
        if (match) visible++;
      });
      if (countEl) countEl.textContent = `${visible} من ${cards.length} فرع`;
      if (noResults) noResults.classList.toggle('show', visible === 0);
    };

    branchSearch.addEventListener('input', filterBranches);
    filterBranches();
  }

  /* ---------- Pre-fill service/package choice from links like ?choice=... ---------- */
  const params = new URLSearchParams(window.location.search);
  const choice = params.get('choice');
  const choiceSelect = document.querySelector('#choiceSelect');
  if (choice && choiceSelect) {
    [...choiceSelect.options].forEach(opt => {
      if (opt.value === choice) opt.selected = true;
    });
  }
});

//================================================================= serives

const services = [
  {
    index: "01",
    title: "أفلام الحماية PPF",
    short:
      "طبقة شفافة عالية النقاء تحمي الطلاء من الخدوش والحصى، بخاصية المعالجة الذاتية.",
    desc: "طبقة شفافة عالية النقاء تحمي الطلاء من الخدوش والحصى والأحجار، بخاصية المعالجة الذاتية التي تجعل الخدوش السطحية تختفي بالحرارة مع الحفاظ على لمعان الطلاء الأصلي.",
    features: [
      "حماية ضد الخدوش والحصى",
      "خاصية Self-Healing",
      "وضوح استثنائي",
      "طبقة كارهة للماء",
    ],
    warranty: "حتى 10 سنوات",
    price: "1,100 ريال",
    icon: "🛡️",
  },
  {
    index: "02",
    title: "أفلام العزل الحراري",
    short:
      "عوازل حرارية للسيارات تجمع بين الأداء الفائق والمظهر الأنيق لراحة أكثر داخل المقصورة.",
    desc: "عوازل حرارية متطورة تحجب نسبة عالية من الحرارة والأشعة فوق البنفسجية، مما يوفر راحة أكبر داخل السيارة ويحمي المقصورة من التلف.",
    features: [
      "حجب حرارة عالي",
      "حماية من الأشعة فوق البنفسجية",
      "خصوصية أفضل",
      "مظهر أنيق",
    ],
    warranty: "مدى الحياة",
    price: "300 ريال",
    icon: "🌡️",
  },
  {
    index: "03",
    title: "التلميع الاحترافي",
    short:
      "إزالة خدوش الغسيل وأثر التأكسد لإعادة اللمعان الأصلي للطلاء قبل أي طبقة حماية.",
    desc: "عملية تلميع احترافية متعددة المراحل تزيل الخدوش السطحية وآثار التأكسد وتعيد للطلاء لمعانه الأصلي قبل تطبيق أي طبقة حماية.",
    features: [
      "إزالة الخدوش السطحية",
      "استعادة اللمعان",
      "تحضير مثالي للحماية",
      "نتيجة مضمونة",
    ],
    warranty: "نتيجة مضمونة",
    price: "400 ريال",
    icon: "✨",
  },
  {
    index: "04",
    title: "النانو سيراميك",
    short:
      "حماية متقدمة بصلابة تصل إلى 10H، تمنح لمعة عميقة ومقاومة قوية للخدوش والعوامل الجوية.",
    desc: "طلاء نانو سيراميك بصلابة 10H يمنح السيارة لمعة عميقة وحماية قوية ضد الخدوش والعوامل البيئية مع سهولة في التنظيف.",
    features: ["صلابة 10H", "لمعة عميقة", "مقاومة للخدوش", "حماية طويلة الأمد"],
    warranty: "حتى 10 سنوات",
    price: "800 ريال",
    icon: "💎",
  },
  {
    index: "05",
    title: "حماية الزجاج",
    short:
      "درع واقٍ للزجاج الأمامي وشاشات المقصورة يقاوم الصدمات ويحافظ على الوضوح الكامل.",
    desc: "فيلم حماية للزجاج الأمامي والشاشات الداخلية يقاوم الصدمات والخدوش مع الحفاظ على وضوح الرؤية الكامل.",
    features: ["مقاومة للصدمات", "حماية الشاشات", "وضوح عالي", "سهولة التركيب"],
    warranty: "سنة كاملة",
    price: "250 ريال",
    icon: "🪟",
  },
  {
    index: "06",
    title: "منتجات العناية",
    short:
      "تشكيلة STEK من منتجات العناية المنزلية، من مواد التنظيف إلى مقويات اللمعان طويلة الأمد.",
    desc: "مجموعة متكاملة من منتجات العناية بالسيارة من STEK، تشمل مواد التنظيف ومقويات اللمعان ومنتجات الحفاظ على الحماية.",
    features: [
      "منتجات أصلية",
      "سهلة الاستخدام",
      "نتائج طويلة الأمد",
      "آمنة على الطلاء",
    ],
    warranty: "استبدال 7 أيام",
    price: "150 ريال",
    icon: "🧴",
  },
];

let currentIndex = 0;
let autoPlayTimer = null;

const serviceCard = document.getElementById("serviceCard");
const serviceDetails = document.getElementById("serviceDetails");

const serviceIndex = document.getElementById("serviceIndex");
const serviceTitle = document.getElementById("serviceTitle");
const serviceShort = document.getElementById("serviceShort");
const serviceWarranty = document.getElementById("serviceWarranty");
const servicePrice = document.getElementById("servicePrice");
const serviceIcon = document.getElementById("serviceIcon");

const detailsTitle = document.getElementById("detailsTitle");
const detailsDesc = document.getElementById("detailsDesc");
const detailsFeatures = document.getElementById("detailsFeatures");
const detailsWarranty = document.getElementById("detailsWarranty");
const detailsPrice = document.getElementById("detailsPrice");

const dotsContainer = document.getElementById("serviceDots");

// إنشاء النقاط
services.forEach((_, i) => {
  const dot = document.createElement("span");
  if (i === 0) dot.classList.add("active");
  dot.addEventListener("click", () => {
    goToService(i);
  });
  dotsContainer.appendChild(dot);
});

function updateContent() {
  const s = services[currentIndex];

  serviceIndex.textContent = s.index;
  serviceTitle.textContent = s.title;
  serviceShort.textContent = s.short;
  serviceWarranty.textContent = s.warranty;
  servicePrice.textContent = s.price;
  serviceIcon.textContent = s.icon;

  detailsTitle.textContent = s.title;
  detailsDesc.textContent = s.desc;
  detailsWarranty.textContent = s.warranty;
  detailsPrice.textContent = s.price;

  detailsFeatures.innerHTML = s.features.map((f) => `<li>${f}</li>`).join("");

  // تحديث النقاط
  document.querySelectorAll("#serviceDots span").forEach((dot, i) => {
    dot.classList.toggle("active", i === currentIndex);
  });
}

function changeService(newIndex) {
  // تأثير الاختفاء
  serviceCard.classList.add("fade-out");
  serviceDetails.classList.add("fade-out");

  setTimeout(() => {
    currentIndex = newIndex;
    updateContent();

    // تأثير الظهور
    serviceCard.classList.remove("fade-out");
    serviceDetails.classList.remove("fade-out");
    serviceCard.classList.add("fade-in");
    serviceDetails.classList.add("fade-in");

    setTimeout(() => {
      serviceCard.classList.remove("fade-in");
      serviceDetails.classList.remove("fade-in");
    }, 300);
  }, 300);
}

function goToService(index) {
  if (index === currentIndex) return;
  changeService(index);
  resetAutoPlay();
}

function nextService() {
  const next = (currentIndex + 1) % services.length;
  changeService(next);
}

function prevService() {
  const prev = (currentIndex - 1 + services.length) % services.length;
  changeService(prev);
}

// أزرار التنقل
document.getElementById("nextService").addEventListener("click", () => {
  nextService();
  resetAutoPlay();
});

document.getElementById("prevService").addEventListener("click", () => {
  prevService();
  resetAutoPlay();
});

// التشغيل التلقائي كل 5 ثواني
function startAutoPlay() {
  autoPlayTimer = setInterval(() => {
    nextService();
  }, 4000);
}

function resetAutoPlay() {
  clearInterval(autoPlayTimer);
  startAutoPlay();
}

// تشغيل أولي
updateContent();
startAutoPlay();


