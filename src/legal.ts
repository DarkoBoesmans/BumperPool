// The small-print page: in the language picked in the game, or switched right here. The game itself is not loaded.
import { t } from "./i18n";
import { initLang } from "./ui/lang";

const title = () => void (document.title = t("Tjoepbiljart: the small print"));
initLang(title);
title();

// the contents list marks the section you are reading: the one crossing a line a third down the screen
const links = new Map(
  [...document.querySelectorAll<HTMLAnchorElement>(".c-legal__toc a")].map((a) => [a.hash.slice(1), a]),
);
const io = new IntersectionObserver(
  (seen) => {
    for (const e of seen) {
      if (!e.isIntersecting) continue;
      for (const a of links.values()) a.removeAttribute("aria-current");
      links.get(e.target.id)?.setAttribute("aria-current", "location");
    }
  },
  { rootMargin: "-33% 0px -66% 0px" },
);
for (const id of links.keys()) {
  const sec = document.getElementById(id);
  if (sec) io.observe(sec);
}
