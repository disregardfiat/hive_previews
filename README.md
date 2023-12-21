# hive_previews

Run this service on your static hive frontend and shunt HEAD requests and bot user agents to this service instead of serving static files.

Sample NGINX Directives

```
    proxy_cache_convert_head off;
    proxy_cache_methods GET HEAD;
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