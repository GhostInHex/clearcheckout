import type {Metadata} from 'next';
import type {ReactNode} from 'react';
import '../src/style.css';
export const metadata:Metadata={title:'ClearCheckout',description:'Independent, accessible shopping with explicit confirmation.'};
export default function Layout({children}:{children:ReactNode}){return <html lang="en"><body>{children}</body></html>;}
