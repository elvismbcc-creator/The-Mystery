import "./globals.css";
import {Playfair_Display} from "next/font/google";
const serif=Playfair_Display({subsets:["latin"],variable:"--font-serif"});
export const metadata={title:"THE MYSTERY",description:"Libreta digital multijugador para jugar a Clue"};
export const viewport={themeColor:"#0b0a0c",width:"device-width",initialScale:1};
export default function RootLayout({children}){return <html lang="es" className={serif.variable}><body>{children}</body></html>;}
