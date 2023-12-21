# hive_previews

Run this service on your static hive frontend and shunt HEAD requests and bot user agents to this service instead of serving static files.

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

Would use your local cache for bots, and cloudflares cache for your static pages.