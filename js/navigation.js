(function () {
  const pages = document.querySelectorAll(".page");
  const navLinks = document.querySelectorAll("[data-page-link]");
  const navToggle = document.querySelector(".nav-toggle");
  const mainNav = document.querySelector(".main-nav");

  function showPage(pageId, missionCode) {
    let found = false;
    pages.forEach((p) => {
      const match = p.id === "page-" + pageId;
      p.classList.toggle("active", match);
      if (match) found = true;
    });
    if (!found) {
      pages.forEach((p) => p.classList.toggle("active", p.id === "page-home"));
    }
    navLinks.forEach((a) => {
      a.classList.toggle("active", a.getAttribute("data-page-link") === pageId);
    });
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    if (mainNav) mainNav.classList.remove("open");

    // Let other modules react (e.g. jump to a specific mission)
    if (missionCode && window.MathCraftDocuments && window.MathCraftDocuments.focusMission) {
      window.MathCraftDocuments.focusMission(pageId, missionCode);
    }
  }

  function navigateFromHash() {
    const hash = window.location.hash.replace("#", "");
    if (!hash) { showPage("home"); return; }
    const [pageId, missionCode] = hash.split("/");
    showPage(pageId, missionCode);
  }

  navLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const pageId = a.getAttribute("data-page-link");
      const missionCode = a.getAttribute("data-mission");
      window.location.hash = missionCode ? pageId + "/" + missionCode : pageId;
    });
  });

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      mainNav.classList.toggle("open");
    });
  }

  window.addEventListener("hashchange", navigateFromHash);
  window.addEventListener("DOMContentLoaded", navigateFromHash);

  window.MathCraftNav = { showPage };
})();
