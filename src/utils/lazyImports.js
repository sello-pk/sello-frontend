// Lazy loading utilities for heavy libraries
export const lazyLoadTipTap = () =>
  import("@tiptap/react").then((module) => module.default);
export const lazyLoadGSAP = () =>
  import("gsap").then((module) => module.default);
export const lazyLoadLeaflet = () =>
  import("leaflet").then((module) => module.default);
export const lazyLoadPDF = () =>
  import("jspdf").then((module) => module.default);
export const lazyLoadXLSX = () =>
  import("xlsx").then((module) => module.default);
export const lazyLoadRecharts = () =>
  import("recharts").then((module) => module.default);
export const lazyLoadGoogleMaps = () =>
  import("@react-google-maps/api").then((module) => module.default);
