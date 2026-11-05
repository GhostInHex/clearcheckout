import type {NextConfig} from 'next';
const config:NextConfig={serverExternalPackages:['better-sqlite3'],poweredByHeader:false,
async redirects(){return [{source:'/clearcheckout-source.zip',destination:'https://github.com/GhostInHex/clearcheckout/archive/refs/heads/main.zip',permanent:false}];},
async headers(){return [{source:'/:path*',headers:[
{key:'Content-Security-Policy',value:"default-src 'self'; base-uri 'self'; font-src 'self' https: data:; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self' 'unsafe-inline'; script-src-attr 'none'; style-src 'self' https: 'unsafe-inline'"},
{key:'Cross-Origin-Opener-Policy',value:'same-origin'},
{key:'Cross-Origin-Resource-Policy',value:'same-origin'},
{key:'Origin-Agent-Cluster',value:'?1'},
{key:'Referrer-Policy',value:'no-referrer'},
{key:'Strict-Transport-Security',value:'max-age=31536000; includeSubDomains'},
{key:'X-Content-Type-Options',value:'nosniff'},
{key:'X-DNS-Prefetch-Control',value:'off'},
{key:'X-Download-Options',value:'noopen'},
{key:'X-Frame-Options',value:'SAMEORIGIN'},
{key:'X-Permitted-Cross-Domain-Policies',value:'none'},
{key:'X-XSS-Protection',value:'0'}]}, {source:'/api/:path*',headers:[{key:'Cache-Control',value:'no-store'}]}];},webpack(config){config.resolve.extensionAlias={'.js':['.ts','.tsx','.js']};return config;}};
export default config;
