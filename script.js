/* ==========================================================================
   Remi — landing page interactions
   1. Footer year
   2. Helpers
   3. GitHub links
   4. Install modal + download
   5. Nav state + scroll reveals
   6. Demo Nooks (content)
   7. NookSwitcher (trackpad / drag / keys)
   8. Hero panel (suggestions, apply → review flow, menu bar)
   9. Hero swipe hint
   10. Gestures section demo
   11. Liquid Glass refraction (Chromium)
   ========================================================================== */

/* 1. Footer year — its own guarded block so nothing below can stop it. */
(function () {
  try {
    var el = document.getElementById('currentYear');
    if (el) el.textContent = String(new Date().getFullYear());
  } catch (e) {
    /* keep the static fallback */
  }
})();

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     2. Helpers
     ------------------------------------------------------------------ */
  var root = document.documentElement;
  root.classList.add('js');

  var reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isReduced = function () {
    return reducedMQ.matches;
  };
  var $ = function (sel, ctx) {
    return (ctx || document).querySelector(sel);
  };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };
  var clamp = function (v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  };
  var escapeHTML = function (s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  };
  var restartClass = function (el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  };
  var hexToRgba = function (hex, a) {
    var h = String(hex).trim().replace('#', '');
    if (h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h, 16);
    if (isNaN(n)) return 'rgba(10, 132, 255, ' + a + ')';
    return 'rgba(' + ((n >> 16) & 255) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ', ' + a + ')';
  };

  /* ------------------------------------------------------------------
     3. GitHub links
     ------------------------------------------------------------------ */
  var GH_URL = (window.REMI_GITHUB_URL && String(window.REMI_GITHUB_URL)) || '';
  var GH_RELEASES_URL = GH_URL ? GH_URL.replace(/\/$/, '') + '/releases' : '';

  $$('a[href="#github"]').forEach(function (a) {
    if (GH_URL) {
      a.href = a.hasAttribute('data-releases-link') && GH_RELEASES_URL ? GH_RELEASES_URL : GH_URL;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    } else {
      a.href = '#open-source';
    }
  });

  /* ------------------------------------------------------------------
     4. Install modal + download
     ------------------------------------------------------------------ */
  var modal = document.getElementById('installModal');
  var modalClose = modal.querySelector('.modal-close');
  var lastTrigger = null;

  var openModal = function () {
    lastTrigger = document.activeElement;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  };

  var closeModal = function () {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      lastTrigger.focus({ preventScroll: true });
    }
  };

  var getLatestReleaseDownloadUrl = async function () {
    try {
      var repo = GH_URL.replace('https://github.com/', '');
      var response = await fetch('https://api.github.com/repos/' + repo + '/releases/latest');
      var release = await response.json();
      var asset = release.assets.find(function (a) {
        return a.name.toLowerCase().includes('remi') && (a.name.endsWith('.zip') || a.name.endsWith('.app'));
      });
      return asset ? asset.browser_download_url : null;
    } catch (error) {
      return null;
    }
  };

  var triggerDownload = function (url, filename) {
    var link = document.createElement('a');
    link.href = url;
    link.download = filename || '';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  $$('a[href="#download"]').forEach(function (a) {
    a.addEventListener('click', async function (e) {
      e.preventDefault();
      openModal();
      if (!GH_URL) return;
      try {
        var downloadUrl = await getLatestReleaseDownloadUrl();
        if (downloadUrl) {
          triggerDownload(downloadUrl, downloadUrl.split('/').pop());
        } else {
          window.open(GH_RELEASES_URL, '_blank');
        }
      } catch (error) {
        window.open(GH_RELEASES_URL, '_blank');
      }
    });
  });

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') {
      e.stopImmediatePropagation();
      closeModal();
      return;
    }
    if (e.key === 'Tab') {
      var focusables = $$('a[href], button:not([disabled])', modal);
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  /* ------------------------------------------------------------------
     5. Nav state + scroll reveals
     ------------------------------------------------------------------ */
  var nav = $('.nav');
  var onNavScroll = function () {
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onNavScroll, { passive: true });
  onNavScroll();

  $$('.bento .reveal').forEach(function (el, i) {
    el.style.setProperty('--d', i * 70 + 'ms');
  });
  if ('IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealIO.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' }
    );
    $$('.reveal').forEach(function (el) {
      revealIO.observe(el);
    });
  } else {
    $$('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ------------------------------------------------------------------
     6. Demo Nooks — each with its own icon, color and AI suggestion
     ------------------------------------------------------------------ */
  var NOOKS = [
    {
      name: "Achraf's notes",
      glyph: 'i-doc',
      color: 'blue',
      icon: 'i-checklist',
      title: 'Streamline Checklist',
      desc: 'Rewrite the audio shopping list as a concise, consistent checklist.',
      original:
        'Audio shopping list\nStatus: planning, budget TBD\n\nEssentials\n- [ ] KZ ZSN Pro X IEMs\n- [ ] Moondrop A3 iems??\n- [ ] moondrop blessing 3 headphones\n- [ ] a usb-c dac (small one)\n- [ ] 3.5mm cable\n\nMaybe\n- ear tips, case, spare cable',
      improved:
        'Audio Shopping List\nStatus: Planning\n\nEssentials\n- [ ] KZ ZSN Pro X IEMs\n- [ ] Moondrop A3 IEMs\n- [ ] Moondrop Blessing 3 Headphones\n- [ ] USB-C DAC\n- [ ] 3.5 mm Audio Cable\n\nOptional\n- [ ] Replacement Ear Tips\n- [ ] Carrying Case\n- [ ] Spare Cable'
    },
    {
      name: 'Prompts',
      glyph: 'i-briefcase',
      color: 'indigo',
      icon: 'i-sparkle',
      title: 'Tighten Prompt',
      desc: 'Make this prompt shorter, clearer and structured.',
      original:
        'Code review prompt\n\nyou are a senior engineer, please review this diff and tell me whats wrong and also suggest fixes, be nice but honest, and also check naming, and tests too if there are any, keep it short-ish',
      improved:
        'Code Review Prompt\n\nRole: Senior engineer reviewing a diff.\nCheck:\n- Correctness and edge cases\n- Naming and readability\n- Test coverage\nOutput: Issues first, then fixes.\nTone: Direct, kind, brief.'
    },
    {
      name: 'Groceries',
      glyph: 'i-cart',
      color: 'green',
      icon: 'i-checklist',
      title: 'Organize Tasks',
      desc: 'Group items by aisle as a clean checklist.',
      original:
        'Groceries\n\nmilk, spinach, eggs x12, oat milk too\ncoffee beans!! (the light roast)\ntomatoes, basil, parmesan\ndish soap, and bin bags\nlemons',
      improved:
        'Groceries\n\nProduce\n- [ ] Spinach, tomatoes, basil, lemons\nDairy\n- [ ] Milk, oat milk, eggs (12), parmesan\nPantry\n- [ ] Coffee beans, light roast\nHome\n- [ ] Dish soap, bin bags'
    },
    {
      name: 'Ideas',
      glyph: 'i-bulb',
      color: 'orange',
      icon: 'i-checklist',
      title: 'Summarize',
      desc: 'Turn these thoughts into three clear bullets.',
      original:
        'Ideas for the weekend build\n\nwhat if the menu bar icon showed a tiny dot when there is an unapplied suggestion? also maybe nooks could have colors. and a quick-capture field that opens with the hotkey and just appends a line',
      improved:
        'Weekend Build Ideas\n\n- Menu bar dot for pending suggestions\n- Color tags for Nooks\n- Quick capture: the hotkey appends a line'
    }
  ];

  var nookColor = function (n) {
    return 'var(--nook-' + n.color + ')';
  };
  var rippleFor = function (n) {
    return hexToRgba(getComputedStyle(root).getPropertyValue('--nook-' + n.color), 0.26);
  };

  /* ------------------------------------------------------------------
     7. NookSwitcher
     The label track follows the gesture 1:1 (rubber-banded past the first
     and last Nook), then springs to the nearest Nook — or the next one if
     the gesture travelled far or fast enough. A trackpad swipe changes at
     most one Nook: after a switch, wheel input is ignored until it has
     been idle for WHEEL_LOCK_MS, which swallows the momentum tail.
     Vertical wheel input is never captured, so page scrolling still works.
     ------------------------------------------------------------------ */
  var WHEEL_SETTLE_MS = 120;
  var WHEEL_LOCK_MS = 150;
  var COMMIT_DISTANCE = 0.4; // of bar width, while the gesture is live
  var SNAP_DISTANCE = 0.2; // of bar width, on release
  var SNAP_VELOCITY = 0.45; // px/ms, on release
  var SPRING = 'transform 560ms cubic-bezier(.3, 1.35, .55, 1)';

  function NookSwitcher(bar, opts) {
    this.bar = bar;
    this.track = $('[data-track]', bar);
    this.nooks = opts.nooks;
    this.onChange = opts.onChange || function () {};
    this.onInteract = opts.onInteract || function () {};
    this.index = 0;
    this.offset = 0;
    this.locked = false;
    this.lastX = null;
    this.drag = null;
    this.wheel = { acc: 0, committed: false, timer: 0, lastTs: -Infinity };

    this.track.innerHTML = this.nooks
      .map(function (n) {
        return (
          '<div class="nook-item" style="--nook: ' +
          nookColor(n) +
          '"><svg class="ico" aria-hidden="true"><use href="#' +
          n.glyph +
          '" /></svg><span>' +
          escapeHTML(n.name) +
          '</span></div>'
        );
      })
      .join('');
    this.items = $$('.nook-item', this.track);
    this.bindSurface(bar, true);
    this.layout(false);
  }

  NookSwitcher.prototype.width = function () {
    return this.bar.clientWidth || 300;
  };

  NookSwitcher.prototype.layout = function (animate) {
    this.track.style.transition = animate && !isReduced() ? SPRING : 'none';
    this.track.style.transform = 'translateX(calc(' + -this.index * 100 + '% + ' + this.offset + 'px))';
    this.bar.classList.toggle('is-tracking', this.offset !== 0);
    var idx = this.index;
    this.items.forEach(function (it, i) {
      it.classList.toggle('is-off', i !== idx);
    });
    this.bar.style.setProperty('--ripple', rippleFor(this.nooks[idx]));
  };

  // Offset that follows the finger; rubber-bands where there is no Nook to reveal.
  NookSwitcher.prototype.follow = function (dx) {
    var w = this.width();
    var pastStart = this.index === 0 && dx > 0;
    var pastEnd = this.index === this.nooks.length - 1 && dx < 0;
    if (pastStart || pastEnd) {
      var x = Math.abs(dx);
      dx = (dx < 0 ? -1 : 1) * (1 - 1 / ((x * 0.55) / w + 1)) * w * 0.5;
    }
    this.offset = clamp(dx, -w, w);
    this.layout(false);
  };

  NookSwitcher.prototype.snapBack = function () {
    this.offset = 0;
    this.layout(true);
  };

  // Decide where a finished gesture lands.
  NookSwitcher.prototype.settle = function (dx, velocity) {
    var far = Math.abs(dx) > this.width() * SNAP_DISTANCE;
    var fast = Math.abs(velocity || 0) > SNAP_VELOCITY;
    if (dx && (far || fast)) this.step(dx < 0 ? 1 : -1);
    else this.snapBack();
  };

  NookSwitcher.prototype.step = function (dir, opts) {
    if (this.locked) return;
    var next = this.index + dir;
    if (next < 0 || next >= this.nooks.length) {
      if (this.offset) this.snapBack();
      else this.bounce(dir);
      return;
    }
    this.set(next, dir, opts);
  };

  NookSwitcher.prototype.set = function (i, dir, opts) {
    if (this.locked || i === this.index) {
      this.snapBack();
      return;
    }
    this.index = i;
    this.offset = 0;
    this.layout(true);
    this.haptic(opts && opts.auto);
    this.onChange(i, dir || 1);
  };

  NookSwitcher.prototype.bounce = function (dir) {
    if (isReduced() || !this.track.animate) return;
    var base = -this.index * 100;
    this.track.animate(
      [
        { transform: 'translateX(' + base + '%)' },
        { transform: 'translateX(calc(' + base + '% + ' + -dir * 22 + 'px))' },
        { transform: 'translateX(' + base + '%)' }
      ],
      { duration: 420, easing: 'cubic-bezier(.3, 1.35, .55, 1)' }
    );
  };

  // Visual tick + ripple on every switch; a short vibration where the platform
  // supports it (Android) and only after a real user activation.
  NookSwitcher.prototype.haptic = function (auto) {
    var bar = this.bar;
    var rect = bar.getBoundingClientRect();
    var x = this.lastX != null ? this.lastX - rect.left : rect.width / 2;
    bar.style.setProperty('--rx', clamp(x, 0, rect.width) + 'px');
    this.lastX = null;
    if (!isReduced()) restartClass(bar, 'tick');
    var activated = !navigator.userActivation || navigator.userActivation.hasBeenActive;
    if (!auto && activated && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(10);
      } catch (err) {
        /* unsupported */
      }
    }
  };

  NookSwitcher.prototype.onWheel = function (e) {
    var dx = e.deltaX;
    var dy = e.deltaY;
    if (e.shiftKey && !dx) {
      dx = dy;
      dy = 0;
    }
    if (Math.abs(dx) < 0.5 || Math.abs(dx) <= Math.abs(dy)) return; // vertical: let the page scroll
    if (e.deltaMode === 1) dx *= 16;
    e.preventDefault();
    this.onInteract();

    var self = this;
    var w = this.wheel;
    // Gesture boundaries come from input timestamps, not timers, so a busy
    // main thread can never split one swipe into two.
    var gap = e.timeStamp - w.lastTs;
    w.lastTs = e.timeStamp;
    if (w.committed) {
      if (gap < WHEEL_LOCK_MS) return; // momentum tail of the swipe that already switched
      w.committed = false;
      w.acc = 0;
    }
    if (this.locked) return;

    clearTimeout(w.timer);
    w.timer = setTimeout(function () {
      // Fingers lifted without committing: land on the nearest Nook.
      if (!w.acc) return;
      var dist = -w.acc;
      w.acc = 0;
      if (Math.abs(dist) > self.width() * SNAP_DISTANCE) w.committed = true;
      self.settle(dist, 0);
    }, WHEEL_SETTLE_MS);

    w.acc += dx;
    this.follow(-w.acc);
    if (Math.abs(w.acc) > this.width() * COMMIT_DISTANCE) {
      clearTimeout(w.timer);
      w.committed = true;
      this.lastX = e.clientX;
      this.step(w.acc > 0 ? 1 : -1);
      w.acc = 0;
    }
  };

  NookSwitcher.prototype.bindSurface = function (el, isBar) {
    var self = this;

    el.addEventListener(
      'wheel',
      function (e) {
        self.onWheel(e);
      },
      { passive: false }
    );

    el.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || self.locked) return;
      self.drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false, vx: 0, px: e.clientX, pt: e.timeStamp };
    });

    el.addEventListener('pointermove', function (e) {
      var d = self.drag;
      if (!d || d.id !== e.pointerId) return;
      var dx = e.clientX - d.x;
      var dy = e.clientY - d.y;
      if (!d.moved) {
        if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
          d.moved = true;
          try {
            el.setPointerCapture(e.pointerId);
          } catch (err) {
            /* capture unsupported */
          }
          self.onInteract();
        } else {
          if (Math.abs(dy) > 10) self.drag = null;
          return;
        }
      }
      var dt = e.timeStamp - d.pt;
      if (dt > 0) d.vx = 0.8 * ((e.clientX - d.px) / dt) + 0.2 * d.vx;
      d.px = e.clientX;
      d.pt = e.timeStamp;
      self.follow(dx);
    });

    var end = function (e) {
      var d = self.drag;
      if (!d || d.id !== e.pointerId) return;
      self.drag = null;
      self.lastX = e.clientX;
      if (d.moved) {
        self.settle(e.clientX - d.x, e.type === 'pointerup' ? d.vx : 0);
      } else if (e.type === 'pointerup' && isBar) {
        // A plain click on the bar advances to the next Nook.
        self.onInteract();
        self.set((self.index + 1) % self.nooks.length, 1);
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);

    if (!isBar) return;
    el.addEventListener('keydown', function (e) {
      var last = self.nooks.length - 1;
      if (e.key === 'ArrowRight') self.step(1);
      else if (e.key === 'ArrowLeft') self.step(-1);
      else if (e.key === 'Home') self.set(0, -1);
      else if (e.key === 'End') self.set(last, 1);
      else return;
      e.preventDefault();
      self.onInteract();
    });
  };

  /* ------------------------------------------------------------------
     8. Hero panel
     ------------------------------------------------------------------ */
  var panel = $('[data-remi-panel]');
  var heroSwitcher = null;
  var dismissHint = function () {};

  if (panel) {
    var note = $('[data-note]', panel);
    var pill = $('[data-suggestion]', panel);
    var pillTitle = $('[data-sug-title]', panel);
    var pillDesc = $('[data-sug-desc]', panel);
    var pillIcon = $('.suggestion-ico use', panel);
    var applyBtn = $('[data-apply]', panel);
    var dismissBtn = $('[data-dismiss]', panel);
    var hud = $('[data-hud]', panel);
    var review = $('[data-review]', panel);
    var diffOrig = $('[data-diff-orig]', panel);
    var diffProp = $('[data-diff-prop]', panel);
    var acceptBtn = $('[data-accept]', panel);
    var rejectBtn = $('[data-reject]', panel);
    var txtBtn = $('[data-txt]', panel);
    var aiBtn = $('[data-ai]', panel);
    var heroBar = $('[data-nookbar]', panel);
    var dotsWrap = $('[data-dots]');
    var live = $('[data-live]');

    var state = NOOKS.map(function () {
      return { status: 'pending' };
    });
    var busy = false;

    var renderNote = function (text, mode, dir) {
      note.innerHTML = text
        .split('\n')
        .map(function (l, i) {
          return '<span class="ln" style="--i: ' + i + '">' + escapeHTML(l) + '</span>';
        })
        .join('');
      note.classList.remove('is-switch', 'is-morph');
      if (mode && !isReduced()) {
        note.style.setProperty('--dir', dir || 1);
        void note.offsetWidth;
        note.classList.add(mode === 'switch' ? 'is-switch' : 'is-morph');
      }
    };

    var currentText = function (i) {
      return state[i].status === 'applied' ? NOOKS[i].improved : NOOKS[i].original;
    };

    var renderPill = function (i, animate) {
      var n = NOOKS[i];
      var s = state[i].status;
      pill.classList.remove('is-enter');
      if (s === 'applied') {
        pillIcon.setAttribute('href', '#i-check');
        pillTitle.textContent = 'Edit applied';
        pillDesc.textContent = 'You reviewed and accepted “' + n.title + '”.';
        applyBtn.textContent = 'Undo';
        applyBtn.setAttribute('aria-label', 'Undo ' + n.title);
        dismissBtn.hidden = true;
      } else {
        pillIcon.setAttribute('href', '#' + n.icon);
        pillTitle.textContent = n.title;
        pillDesc.textContent = n.desc;
        applyBtn.textContent = 'Apply';
        applyBtn.setAttribute('aria-label', 'Apply suggestion: ' + n.title);
        dismissBtn.hidden = false;
      }
      pill.classList.toggle('is-hidden', s === 'dismissed');
      pill.setAttribute('aria-hidden', s === 'dismissed' ? 'true' : 'false');
      if (animate && s !== 'dismissed' && !isReduced()) {
        void pill.offsetWidth;
        pill.classList.add('is-enter');
      }
    };

    // Pager dots (tablist)
    var dots = NOOKS.map(function (n, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'nook-dot';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', 'heroNote');
      b.setAttribute('aria-label', n.name);
      b.addEventListener('click', function () {
        dismissHint();
        heroSwitcher.set(i, i > heroSwitcher.index ? 1 : -1);
      });
      b.addEventListener('keydown', function (e) {
        var to = null;
        if (e.key === 'ArrowRight') to = Math.min(NOOKS.length - 1, i + 1);
        if (e.key === 'ArrowLeft') to = Math.max(0, i - 1);
        if (to === null || to === i) return;
        e.preventDefault();
        dismissHint();
        heroSwitcher.set(to, to > i ? 1 : -1);
        dots[heroSwitcher.index].focus();
      });
      dotsWrap.appendChild(b);
      return b;
    });

    var syncDots = function (i) {
      dotsWrap.style.setProperty('--active', nookColor(NOOKS[i]));
      dots.forEach(function (d, j) {
        d.setAttribute('aria-selected', j === i ? 'true' : 'false');
        d.tabIndex = j === i ? 0 : -1;
      });
    };

    heroSwitcher = new NookSwitcher(heroBar, {
      nooks: NOOKS,
      onInteract: function () {
        dismissHint();
      },
      onChange: function (i, dir) {
        state.forEach(function (s) {
          if (s.status === 'dismissed') s.status = 'pending';
        });
        renderNote(currentText(i), 'switch', dir);
        renderPill(i, true);
        syncDots(i);
        live.textContent = NOOKS[i].name + ', Nook ' + (i + 1) + ' of ' + NOOKS.length;
      }
    });

    renderNote(currentText(0));
    renderPill(0, false);
    syncDots(0);

    // Apply → "Applying AI edit…" → review sheet → accept / reject
    var setBusy = function (on) {
      busy = on;
      heroSwitcher.locked = on;
      panel.setAttribute('aria-busy', on ? 'true' : 'false');
    };

    var closeReview = function () {
      review.hidden = true;
      note.classList.remove('is-busy');
      setBusy(false);
    };

    var runApply = function () {
      var i = heroSwitcher.index;
      if (busy || state[i].status !== 'pending') return;
      setBusy(true);
      note.classList.add('is-busy');
      hud.hidden = false;
      setTimeout(
        function () {
          hud.hidden = true;
          diffOrig.textContent = NOOKS[i].original;
          diffProp.textContent = NOOKS[i].improved;
          review.hidden = false;
          acceptBtn.focus({ preventScroll: true });
        },
        isReduced() ? 450 : 1350
      );
    };

    var accept = function () {
      if (review.hidden) return;
      var i = heroSwitcher.index;
      state[i].status = 'applied';
      closeReview();
      renderNote(NOOKS[i].improved, 'morph');
      renderPill(i, true);
      live.textContent = 'AI edit accepted.';
      applyBtn.focus({ preventScroll: true });
    };

    var reject = function () {
      if (review.hidden) return;
      closeReview();
      live.textContent = 'AI edit rejected. Your note is unchanged.';
      applyBtn.focus({ preventScroll: true });
    };

    applyBtn.addEventListener('click', function () {
      var i = heroSwitcher.index;
      if (state[i].status === 'applied') {
        state[i].status = 'pending';
        renderNote(NOOKS[i].original, 'morph');
        renderPill(i, true);
        live.textContent = 'Edit undone.';
        return;
      }
      runApply();
    });
    aiBtn.addEventListener('click', function () {
      var i = heroSwitcher.index;
      if (state[i].status === 'dismissed') {
        state[i].status = 'pending';
        renderPill(i, true);
      }
      if (state[i].status === 'pending') runApply();
      else restartClass(pill, 'is-enter');
    });
    dismissBtn.addEventListener('click', function () {
      var i = heroSwitcher.index;
      state[i].status = 'dismissed';
      renderPill(i, false);
      heroBar.focus({ preventScroll: true });
    });
    acceptBtn.addEventListener('click', accept);
    rejectBtn.addEventListener('click', reject);
    document.addEventListener('keydown', function (e) {
      if (review.hidden || modal.classList.contains('active')) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        reject();
      } else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        accept();
      }
    });
    txtBtn.addEventListener('click', function () {
      var on = txtBtn.getAttribute('aria-pressed') !== 'true';
      txtBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      note.classList.toggle('is-mono', on);
    });

    // Point the panel's notch at the menu bar icon
    var stage = $('[data-stage]');
    var mbIcon = $('[data-menubar-icon]', stage);
    var placeNotch = function () {
      var p = panel.getBoundingClientRect();
      var ic = mbIcon.getBoundingClientRect();
      var x = ic.left + ic.width / 2 - p.left;
      panel.style.setProperty('--notch-x', clamp(x, 32, p.width - 32) + 'px');
    };
    window.addEventListener('resize', placeNotch, { passive: true });
    placeNotch();

    // Live menu bar clock
    var clock = $('[data-clock]', stage);
    var tick = function () {
      var d = new Date();
      var date =
        d.toLocaleDateString('en-US', { weekday: 'short' }) +
        ' ' +
        d.getDate() +
        ' ' +
        d.toLocaleDateString('en-US', { month: 'short' });
      var time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      clock.innerHTML = '<span class="mb-date">' + escapeHTML(date) + '</span> ' + escapeHTML(time);
      requestAnimationFrame(placeNotch);
    };
    tick();
    setInterval(tick, 30000);

    /* ----------------------------------------------------------------
       9. Hero swipe hint — a hand glyph drags across the Nook bar and
       the labels follow it, peeking at the next Nook. Plays when the bar
       comes into view (3 passes, at most twice), and is gone for good as
       soon as the visitor swipes, drags, clicks or uses the keys.
       Reduced motion: the hand stays still as a static hint.
       ---------------------------------------------------------------- */
    var hint = $('[data-swipe-hint]', heroBar);
    if (hint) {
      var CYCLE_MS = 2600;
      var CYCLES = 3;
      var hintGone = false;
      var hintRaf = 0;
      var sessions = 0;
      var barVisible = false;

      var ease = function (t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };
      var setHand = function (x, scale, opacity) {
        hint.style.transform = 'translate(calc(-50% + ' + x + 'px), -50%) scale(' + scale + ')';
        hint.style.opacity = opacity;
      };

      var stopHint = function () {
        cancelAnimationFrame(hintRaf);
        hintRaf = 0;
      };

      dismissHint = function () {
        if (hintGone) return;
        hintGone = true;
        stopHint();
        hint.classList.add('is-gone');
        if (heroSwitcher.offset && !heroSwitcher.drag) heroSwitcher.snapBack();
      };

      var play = function () {
        if (hintGone || hintRaf || sessions >= 2) return;
        sessions++;
        var start = performance.now();
        var released = false;
        var lastCycle = 0;
        var frame = function (now) {
          var t = now - start;
          var cycle = Math.floor(t / CYCLE_MS);
          if (hintGone) return;
          // Finish the current pass, then stop if done or scrolled away.
          if (cycle !== lastCycle) {
            lastCycle = cycle;
            if (cycle >= CYCLES || !barVisible) {
              setHand(0, 1, 0);
              hintRaf = 0;
              return;
            }
          }
          var w = heroBar.clientWidth;
          var from = w * 0.3;
          var to = -w * 0.14;
          var p = t % CYCLE_MS;
          var x = from;
          var scale = 1;
          var opacity = 0;
          var nudge = 0;
          if (p < 300) {
            opacity = p / 300;
            scale = 0.85 + 0.15 * (p / 300);
            released = false;
          } else if (p < 450) {
            opacity = 1;
            scale = 1 - 0.08 * ((p - 300) / 150);
          } else if (p < 1250) {
            var k = ease((p - 450) / 800);
            opacity = 1;
            scale = 0.92;
            x = from + (to - from) * k;
            nudge = x - from; // labels follow the hand 1:1, the next Nook peeks in
          } else if (p < 1550) {
            var r = (p - 1250) / 300;
            x = to;
            scale = 0.92 + 0.08 * r;
            opacity = 1 - r;
            if (!released) {
              released = true;
              if (!heroSwitcher.locked) heroSwitcher.snapBack();
            }
          }
          setHand(x, scale, opacity);
          if (nudge && !heroSwitcher.locked) {
            heroSwitcher.offset = nudge;
            heroSwitcher.layout(false);
          }
          hintRaf = requestAnimationFrame(frame);
        };
        hintRaf = requestAnimationFrame(frame);
      };

      if (isReduced()) {
        hint.classList.add('is-static');
      } else if ('IntersectionObserver' in window) {
        new IntersectionObserver(
          function (entries) {
            barVisible = entries[0].isIntersecting;
            if (barVisible && !hintRaf) {
              setTimeout(function () {
                if (barVisible) play();
              }, 600);
            }
          },
          { threshold: 1 }
        ).observe(heroBar);
      }
    }
  }

  /* ------------------------------------------------------------------
     10. Gestures section — the trackpad illustration drives its own bar
     ------------------------------------------------------------------ */
  var demo = $('[data-gesture-demo]');
  if (demo) {
    var pad = $('[data-trackpad]', demo);
    var caption = $('[data-gesture-caption]', demo);
    var gBar = $('[data-nookbar]', demo);
    var pausedUntil = 0;
    var inView = false;
    var dir = 1;
    var loop = 0;

    var gSwitcher = new NookSwitcher(gBar, {
      nooks: NOOKS,
      onInteract: function () {
        pausedUntil = performance.now() + 9000;
      },
      onChange: function (i) {
        caption.textContent = NOOKS[i].name + ' · ' + (i + 1) + ' of ' + NOOKS.length;
        if (!isReduced()) restartClass(pad, 'haptic');
      }
    });
    gSwitcher.bindSurface(pad, false);

    var autoplay = function () {
      if (!inView || isReduced() || document.hidden || performance.now() < pausedUntil) return;
      if (gSwitcher.index >= NOOKS.length - 1) dir = -1;
      else if (gSwitcher.index <= 0) dir = 1;
      pad.classList.remove('swipe-l', 'swipe-r');
      void pad.offsetWidth;
      pad.classList.add(dir > 0 ? 'swipe-l' : 'swipe-r');
      setTimeout(function () {
        if (performance.now() < pausedUntil) return;
        gSwitcher.step(dir, { auto: true });
      }, 640);
    };

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        function (entries) {
          inView = entries[0].isIntersecting;
          clearInterval(loop);
          if (inView && !isReduced()) {
            setTimeout(autoplay, 500);
            loop = setInterval(autoplay, 2800);
          }
        },
        { threshold: 0.45 }
      ).observe(demo);
    }
  }

  /* ------------------------------------------------------------------
     11. Liquid Glass refraction (Chromium only)
     Each [data-lg] element gets its own SVG filter whose displacement map
     is generated from a rounded-rect signed distance field: pixels inside
     the bezel sample the backdrop from further inward, bending the scene
     at the rim like a convex lens. Safari / Firefox keep the CSS
     blur + saturate + specular rim fallback.
     ------------------------------------------------------------------ */
  (function liquidGlass() {
    var brands = navigator.userAgentData && navigator.userAgentData.brands;
    var chromium =
      !!brands &&
      brands.some(function (b) {
        return /Chromium|Google Chrome|Microsoft Edge/.test(b.brand);
      });
    if (!chromium || !window.CSS || !CSS.supports('backdrop-filter', 'url(#x)')) return;

    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    var defs = document.createElementNS(NS, 'defs');
    svg.appendChild(defs);
    document.body.appendChild(svg);
    root.classList.add('lg-on');

    var mk = function (tag, attrs, parent) {
      var el = document.createElementNS(NS, tag);
      for (var k in attrs) el.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(el);
      return el;
    };

    var buildMap = function (w, h, r, bezel) {
      var S = 0.5;
      var cw = Math.max(2, Math.round(w * S));
      var ch = Math.max(2, Math.round(h * S));
      var c = document.createElement('canvas');
      c.width = cw;
      c.height = ch;
      var ctx = c.getContext('2d');
      var img = ctx.createImageData(cw, ch);
      var data = img.data;
      var hw = w / 2;
      var hh = h / 2;
      for (var y = 0; y < ch; y++) {
        for (var x = 0; x < cw; x++) {
          var px = (x + 0.5) / S - hw;
          var py = (y + 0.5) / S - hh;
          var qx = Math.abs(px) - (hw - r);
          var qy = Math.abs(py) - (hh - r);
          var ox = Math.max(qx, 0);
          var oy = Math.max(qy, 0);
          var outside = Math.sqrt(ox * ox + oy * oy);
          var d = -(outside + Math.min(Math.max(qx, qy), 0) - r);
          var R = 128;
          var G = 128;
          if (d >= 0 && d < bezel) {
            var nx;
            var ny;
            if (qx > 0 && qy > 0) {
              nx = qx / (outside || 1);
              ny = qy / (outside || 1);
            } else if (qx > qy) {
              nx = 1;
              ny = 0;
            } else {
              nx = 0;
              ny = 1;
            }
            nx *= px < 0 ? -1 : 1;
            ny *= py < 0 ? -1 : 1;
            var t = 1 - d / bezel;
            var mag = t * t * (0.6 + 0.4 * t);
            R = 128 - nx * mag * 127;
            G = 128 - ny * mag * 127;
          }
          var o = (y * cw + x) * 4;
          data[o] = R;
          data[o + 1] = G;
          data[o + 2] = 128;
          data[o + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      return c.toDataURL();
    };

    var count = 0;
    var apply = function (el) {
      var w = el.offsetWidth;
      var h = el.offsetHeight;
      if (!w || !h) return;
      var cs = getComputedStyle(el);
      var r = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, w / 2, h / 2);
      var bezel = Math.min(parseFloat(el.dataset.lgBezel) || 16, h / 2, w / 2);
      var scale = parseFloat(el.dataset.lgScale) || 40;
      var blur = parseFloat(el.dataset.lgBlur) || 1;
      var key = [w, h, r, bezel].join('|');
      if (el.__lgKey === key) return;
      el.__lgKey = key;

      if (!el.__lg) {
        var id = 'lg-' + count++;
        var f = mk('filter', { id: id, filterUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB' }, defs);
        var feImg = mk('feImage', { result: 'map', x: 0, y: 0, preserveAspectRatio: 'none' }, f);
        mk('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: blur, result: 'soft' }, f);
        mk('feDisplacementMap', { in: 'soft', in2: 'map', scale: scale, xChannelSelector: 'R', yChannelSelector: 'G' }, f);
        el.__lg = { id: id, filter: f, img: feImg };
      }
      var lg = el.__lg;
      lg.filter.setAttribute('x', 0);
      lg.filter.setAttribute('y', 0);
      lg.filter.setAttribute('width', w);
      lg.filter.setAttribute('height', h);
      lg.img.setAttribute('width', w);
      lg.img.setAttribute('height', h);
      lg.img.setAttribute('href', buildMap(w, h, r, bezel));
      var value = 'url(#' + lg.id + ') saturate(1.8) brightness(1.04)';
      el.style.backdropFilter = value;
      el.style.webkitBackdropFilter = value;
    };

    var queued = new Set();
    var flush = function () {
      queued.forEach(apply);
      queued.clear();
    };
    var ro = new ResizeObserver(function (entries) {
      entries.forEach(function (en) {
        queued.add(en.target);
      });
      requestAnimationFrame(flush);
    });
    $$('[data-lg]').forEach(function (el) {
      ro.observe(el);
    });
  })();
})();
