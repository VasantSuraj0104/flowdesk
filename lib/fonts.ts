import { Space_Grotesk } from "next/font/google";

/*
  PRODUCTION SWAP:
  Elms Sans and Google Sans Flex aren't on Google Fonts. Once you have the
  licensed .woff2 files, replace this with next/font/local:

    import localFont from "next/font/local";
    export const display = localFont({
      src: "../public/fonts/ElmsSans.woff2",
      variable: "--font-display",
    });
    export const body = localFont({
      src: "../public/fonts/GoogleSansFlex.woff2",
      variable: "--font-body",
    });

  For now we use Space Grotesk as the closest free display match, and let the
  body fall back to Google Sans / system-ui via globals.css.
*/

export const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-display-loaded",
  display: "swap",
});
