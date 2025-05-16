// gestisce globalmente le sessioni (next-auth) in tutte le pagine
import './styles/global.css'; 
import { SessionProvider } from "next-auth/react";

export default function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}