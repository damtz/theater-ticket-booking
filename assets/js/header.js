
    const navLinkEls = document.querySelectorAll('.nav__link');

    // Check if there's a previously stored active link
    const activeLink = localStorage.getItem('activeLink');

    // Set "active" class to the previously stored active link
    if (activeLink) {
      const activeLinkEl = document.querySelector(`[href="${activeLink}"]`);
      if (activeLinkEl) {
        activeLinkEl.classList.add('active');
      }
    }

    navLinkEls.forEach(navLinkEl => {
      navLinkEl.addEventListener('click', (event) => {
        event.preventDefault();

        // Remove "active" class from the previously clicked link
        const activeLink = document.querySelector('.active');
        if (activeLink) {
          activeLink.classList.remove('active');
        }

        // Set "active" class to the clicked link
        navLinkEl.classList.add('active');

        // Store the active link in localStorage
        localStorage.setItem('activeLink', navLinkEl.getAttribute('href'));

        // Navigate to the clicked link
        window.location.href = navLinkEl.getAttribute('href');
      });
    });
  
