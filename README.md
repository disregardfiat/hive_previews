# hive_previews

Since Hive content can generally be assembled 100% client side, we've built a static site. But, we've found 2 uses for generating dynmaic content. The first is to generate meta content for robots ( SEO and Link Previews ). The Second is to generate a manifest / service worker for DLUX dApp content so dApps can have nearly all the bells and whistles of the modern browser.

## Robots and Previews

Run this service on your static hive frontend and shunt HEAD requests and bot user agents to this service instead of serving static files.

Since these routes should only be accesible by upstream rules... you should only have to configure the upstream.

Sample NGINX Directives

```
    proxy_cache_convert_head off;
    proxy_cache_methods HEAD; #Serving static content is a cache necessary?
    location /@ {
        if ( $request_method = HEAD ) {
                proxy_pass http://127.0.0.1:3000;
        }
        if ($http_user_agent ~* "(bot)" ){
                proxy_pass http://127.0.0.1:3000;
        }
        try_files $uri $uri/ /user/index.html?args;
    }

```

If you are using cloudflare you may run into their cache as well and bypassing your cloudflare cache with this rule:

`(http.request.method eq "HEAD") or (http.user_agent contains "bot")`
* Would use your local cache for bots, and cloudflares cache for your static pages.

## Service Worker / manifest.webmanifest
Quite simply this will allow a DLUX dApp to dynamically generate a service worker that builds a cache of included IPFS files. Most importantly the dApp container (index.html) and the application itself (ipfs/CID). This will be called from the dApp container allowing any dApp to be viewed in offline mode.

Future improvements could parse a little more data from the custom_json to define an icon, short app title, or other PWA features.