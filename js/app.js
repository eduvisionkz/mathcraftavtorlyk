(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const iframe = document.getElementById("game-iframe");
    const fallback = document.getElementById("game-fallback");
    if (!iframe) return;

    let loaded = false;
    iframe.addEventListener("load", () => { loaded = true; });

    // If the iframe hasn't fired 'load' shortly after mount (blocked by
    // X-Frame-Options / CSP on the game host), show the "Ойынды ашу" button.
    setTimeout(() => {
      if (!loaded && fallback) {
        fallback.classList.add("show");
      }
    }, 2500);

    iframe.addEventListener("error", () => {
      if (fallback) fallback.classList.add("show");
    });

    // Remember which menu section the teacher/student last viewed,
    // purely for navigation convenience (no lesson data stored).
    try {
      const last = localStorage.getItem("mathcraft-last-page");
      if (last && !window.location.hash) {
        window.location.hash = last;
      }
      window.addEventListener("hashchange", () => {
        localStorage.setItem("mathcraft-last-page", window.location.hash.replace("#", ""));
      });
    } catch (e) {
      /* localStorage unavailable — navigation still works without persistence */
    }
  });
})();
