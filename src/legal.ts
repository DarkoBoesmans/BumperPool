// The small-print page: in the language picked in the game, or switched right here. The game itself is not loaded.
import { t } from "./i18n";
import { initLang } from "./ui/lang";

const title = () => void (document.title = t("Tjoepbiljart: the small print"));
initLang(title);
title();
