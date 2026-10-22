// The words around every page (menu, footer, the app list's labels) in each of
// the site's languages. A page picks its language with `lang: ar` in its front
// matter; without one it's English. Each page's own copy stays in the page.
import { readFileSync } from "node:fs";

const site = JSON.parse(readFileSync(new URL("./site.json", import.meta.url), "utf8"));

export default {
  en: {
    dir: "ltr",
    home: "/",
    ogLocale: "en_US",
    skip: "Skip to content",
    nav: { label: "Main", apps: "apps", blog: "blog", contact: "contact" },
    // The other language, offered in the menu.
    other: { lang: "ar", label: "العربية", href: "/ar/" },
    apps: {
      live: "on the App Store",
      lab: "in the lab",
      soon: "in development",
      worksOn: "Works on",
      download: "Download {app} on the App Store",
      englishOnly: "",
    },
    // The three phones at the top of the home page.
    shots: {
      miqat: "Miqat: the day's prayers on a sky that follows the sun",
      tiqan: "Tiqan: today's full-body workout and the muscles it trains",
      thaqib: "Thaqib: a kid's next star and the five prayers",
    },
    footer: {
      about: `An independent app studio in ${site.place}, making calm, private apps for iPhone, iPad, Apple Watch and Mac.`,
      apps: "apps",
      studio: "studio",
      allApps: "All apps",
      blog: "Blog",
      privacy: "Privacy",
      legal: `Made in ${site.place}. Apple, the Apple logo, iPhone, iPad, Apple Watch and Mac are trademarks of Apple Inc. App Store is a service mark of Apple Inc.`,
    },
  },

  ar: {
    dir: "rtl",
    home: "/ar/",
    ogLocale: "ar_BH",
    skip: "انتقل إلى المحتوى",
    nav: { label: "القائمة الرئيسية", apps: "التطبيقات", blog: "المدونة", contact: "تواصل" },
    other: { lang: "en", label: "English", href: "/" },
    apps: {
      live: "على App Store",
      lab: "في المختبر",
      soon: "قيد التطوير",
      worksOn: "يعمل على",
      download: "حمّل {app} من App Store",
      // Shown under apps that are in English only, so no one is surprised.
      englishOnly: "التطبيق بالإنجليزية فقط.",
    },
    shots: {
      miqat: "ميقات: صلوات اليوم على سماء تتبع الشمس",
      tiqan: "Tiqan: تمرين اليوم لكامل الجسم والعضلات التي يعمل عليها",
      thaqib: "ثاقب: نجمة الطفل القادمة والصلوات الخمس",
    },
    footer: {
      about: `استوديو تطبيقات مستقل في ${site.placeAr}، يصنع تطبيقات هادئة تحفظ خصوصيتك لأجهزة iPhone وiPad وApple Watch وMac.`,
      apps: "التطبيقات",
      studio: "الاستوديو",
      allApps: "كل التطبيقات",
      blog: "المدونة",
      privacy: "الخصوصية",
      legal: `صُنع في ${site.placeAr}. Apple وشعار Apple وiPhone وiPad وApple Watch وMac علامات تجارية لشركة Apple Inc. وApp Store علامة خدمة لشركة Apple Inc.`,
    },
  },
};
