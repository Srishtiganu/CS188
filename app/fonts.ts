import localFont from "next/font/local";

export const specialGothic = localFont({
  src: "../public/fonts/SpecialGothic-Regular.ttf",
  display: "swap",
  variable: "--font-special-gothic",
});

export const specialGothicExpanded = localFont({
  src: "../public/fonts/SpecialGothicExpandedOne-Regular.ttf",
  display: "swap",
  variable: "--font-special-gothic-expanded",
});

export const generalSans = localFont({
  src: "../public/fonts/GeneralSans-Variable.ttf",
  display: "swap",
  variable: "--font-general-sans",
});

export const zodiak = localFont({
  src: "../public/fonts/Zodiak-Variable.ttf",
  display: "swap",
  variable: "--font-zodiak",
});
