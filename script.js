(function () {
  // Light-only: remove any theme handling
  const root = document.documentElement;
  const SHOWCASE_COPY = {
    nooks: 'Nooks — organize prompts, snippets, commands, and notes.',
    quick: 'AI Quick Actions — summarize, refactor, and improve on the fly.',
    rearrange: 'Rearranging — drag Nooks to fit your workflow.',
    models: 'Model Selector — choose Groq, OpenAI, or your preferred provider.'
  };

  // GitHub links configuration
  const GH_URL = (window.REMI_GITHUB_URL && String(window.REMI_GITHUB_URL)) || '';
  const GH_RELEASES_URL = GH_URL ? `${GH_URL.replace(/\/$/, '')}/releases` : '';
  
  document.querySelectorAll('a[href="#github"]').forEach((a) => {
    if (GH_URL) {
      a.href = GH_URL;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    } else {
      a.href = '#community';
    }
  });

  // Modal functionality
  const modal = document.getElementById('installModal');
  const modalOverlay = modal;
  const modalClose = modal.querySelector('.modal-close');

  // Function to open modal
  const openModal = () => {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Focus management for accessibility
    modalClose.focus();
  };

  // Function to close modal
  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Function to get latest release download URL
  const getLatestReleaseDownloadUrl = async () => {
    try {
      const repoUrl = GH_URL.replace('https://github.com/', '');
      const apiUrl = `https://api.github.com/repos/${repoUrl}/releases/latest`;
      
      const response = await fetch(apiUrl);
      const release = await response.json();
      
      // Look for .zip or .app files in assets
      const asset = release.assets.find(asset => 
        asset.name.toLowerCase().includes('remi') && 
        (asset.name.endsWith('.zip') || asset.name.endsWith('.app'))
      );
      
      return asset ? asset.browser_download_url : null;
    } catch (error) {
      console.log('Could not fetch latest release, falling back to releases page');
      return null;
    }
  };

  // Function to trigger download
  const triggerDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || '';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle download button clicks - download latest release and show modal
  document.querySelectorAll('a[href="#download"]').forEach((a) => {
    a.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Show modal immediately
      openModal();
      
      // Try to get and download the latest release
      if (GH_URL) {
        try {
          const downloadUrl = await getLatestReleaseDownloadUrl();
          if (downloadUrl) {
            // Extract filename from URL
            const filename = downloadUrl.split('/').pop();
            // Start download
            triggerDownload(downloadUrl, filename);
          } else {
            // Fallback to releases page if we can't get direct download
            window.open(GH_RELEASES_URL, '_blank');
          }
        } catch (error) {
          console.log('Download failed, opening releases page');
          window.open(GH_RELEASES_URL, '_blank');
        }
      }
    });
  });

  // Handle modal close events
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Handle escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Update GitHub links in modal
  const modalGithubLink = modal.querySelector('a[href="#github"]');
  if (modalGithubLink && GH_RELEASES_URL) {
    modalGithubLink.href = GH_RELEASES_URL;
  }

  // Ensure light only
  root.removeAttribute('data-theme');

  // Enhanced reveal on scroll with staggered animations
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

  // Enhanced interactions for step cards
  document.querySelectorAll('.step-card').forEach((card, index) => {
    // Add hover sound effect simulation
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
    });

    // Add click interaction for mobile
    card.addEventListener('click', () => {
      card.classList.toggle('active');
    });
  });

  // Interactive nook items
  document.querySelectorAll('.nook-item').forEach((item) => {
    item.addEventListener('click', () => {
      // Reset all items
      document.querySelectorAll('.nook-item').forEach(i => i.classList.remove('selected'));
      // Select current item
      item.classList.add('selected');
      
      // Add a brief glow effect
      item.style.boxShadow = '0 0 20px rgba(188, 79, 44, 0.3)';
      setTimeout(() => {
        item.style.boxShadow = '';
      }, 1000);
    });
  });

  // Interactive AI selector
  document.querySelectorAll('.ai-option').forEach((option) => {
    option.addEventListener('click', () => {
      // Reset all options
      document.querySelectorAll('.ai-option').forEach(opt => opt.classList.remove('active'));
      // Activate current option
      option.classList.add('active');
    });
  });

  // Hotkey demonstration animation
  const startHotkeyDemo = () => {
    const keys = document.querySelectorAll('.hotkey-animation kbd');
    const popup = document.querySelector('.result-popup');
    
    keys.forEach((key, index) => {
      setTimeout(() => {
        key.style.transform = 'translateY(-4px) scale(1.1)';
        key.style.borderColor = 'var(--orange-500)';
        key.style.boxShadow = '0 4px 12px rgba(188, 79, 44, 0.3)';
        setTimeout(() => {
          key.style.transform = '';
          key.style.borderColor = '';
          key.style.boxShadow = '';
        }, 400);
      }, index * 400);
    });

    // Show popup after all keys are pressed
    setTimeout(() => {
      if (popup) {
        popup.style.opacity = '1';
        popup.style.transform = 'translateY(0) scale(1)';
        setTimeout(() => {
          popup.style.opacity = '0';
          popup.style.transform = 'translateY(10px) scale(0.9)';
        }, 2500);
      }
    }, 1600);
  };

  // Start hotkey demo when step 4 comes into view
  const step4Observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.target.getAttribute('data-step') === '4') {
          setTimeout(startHotkeyDemo, 1500);
          // Start repeating demo every 8 seconds
          setInterval(startHotkeyDemo, 8000);
          step4Observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.5 }
  );

  const step4 = document.querySelector('.step-card[data-step="4"]');
  if (step4) {
    step4Observer.observe(step4);
  }

  // Showcase tabs
  const tabs = Array.from(document.querySelectorAll('[data-showcase-tab]'));
  const caption = document.getElementById('showcaseCaption');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const key = tab.getAttribute('data-showcase-tab');
      if (caption && key && SHOWCASE_COPY[key]) {
        caption.textContent = SHOWCASE_COPY[key];
      }
    });
  });

  // Smooth scroll for in-page links
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId.length === 1) return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Set current year in footer
  const currentYearElement = document.getElementById('currentYear');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }

  // Groq Section - Simple Counter Animation
  const initGroqStats = () => {
    const animateCounter = (element, target, suffix = '') => {
      const duration = 1500;
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      let step = 0;
      
      const timer = setInterval(() => {
        step++;
        current = Math.min(target, increment * step);
        
        if (suffix === '%') {
          element.textContent = current.toFixed(1) + suffix;
        } else if (suffix === 'ms') {
          element.textContent = Math.ceil(current) + suffix;
        } else {
          element.textContent = Math.ceil(current) + suffix;
        }
        
        if (step >= steps) {
          clearInterval(timer);
        }
      }, duration / steps);
    };

    // Simple intersection observer for stats
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const statNumbers = entry.target.querySelectorAll('.stat-number[data-count]');
          statNumbers.forEach((stat) => {
            const target = parseInt(stat.dataset.count);
            const unit = stat.nextElementSibling.textContent;
            let suffix = '';
            
            if (unit.includes('uptime')) suffix = '%';
            else if (unit.includes('latency')) suffix = 'ms';
            else if (unit.includes('tokens')) suffix = '+';
            
            animateCounter(stat, target, suffix);
          });
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.7 });

    const statsSection = document.querySelector('.groq-stats');
    if (statsSection) {
      statsObserver.observe(statsSection);
    }
  };

  // Initialize when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initGroqStats();
      // Trigger entrance animations
      setTimeout(() => {
        document.body.classList.add('loaded');
      }, 100);
    });
  } else {
    initGroqStats();
    setTimeout(() => {
      document.body.classList.add('loaded');
    }, 100);
  }
})();


