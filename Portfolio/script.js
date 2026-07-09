/**
 * 포트폴리오 웹사이트 인터랙션 스크립트
 * - 모바일 메뉴 토글
 * - 스크롤 시 헤더 스타일 변경
 * - 현재 섹션 내비게이션 하이라이트
 * - 스크롤 등장 애니메이션
 */

// DOM 요소 참조
const header = document.getElementById("header");
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll(".section, .hero");

/* -----------------------------------------------
   1. 모바일 햄버거 메뉴 열기/닫기
   ----------------------------------------------- */
navToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.toggle("open");
  navToggle.classList.toggle("open", isOpen);
  navToggle.setAttribute("aria-expanded", isOpen);
  navToggle.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
});

// 메뉴 링크 클릭 시 모바일 메뉴 자동 닫기
navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "메뉴 열기");
  });
});

/* -----------------------------------------------
   2. 스크롤 시 헤더에 그림자 추가
   ----------------------------------------------- */
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 50);
});

/* -----------------------------------------------
   3. 스크롤 위치에 따라 내비게이션 활성 링크 표시
   ----------------------------------------------- */
function updateActiveNav() {
  const scrollPos = window.scrollY + header.offsetHeight + 100;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute("id");

    if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${sectionId}`);
      });
    }
  });
}

window.addEventListener("scroll", updateActiveNav);
updateActiveNav();

/* -----------------------------------------------
   4. Intersection Observer: 섹션이 화면에 들어올 때 페이드인
   ----------------------------------------------- */
const revealTargets = document.querySelectorAll(
  ".about-grid, .skills-grid, .projects-grid, .timeline, .contact-grid, .section-title"
);

revealTargets.forEach((el) => el.classList.add("reveal"));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);

revealTargets.forEach((el) => observer.observe(el));
