const express = require('express');
const cors = require('cors');
const config = require('./config.js');
const fetch = require('node-fetch');

const app = express();

app.use(cors());

// Add your routes here

app.get('/@:un', (req, res) => {
    var un = req.params.un;
    const protocol = req.protocol;
    const host = req.hostname
    getHiveAccount(un, protocol, host).then((template) => {
        res.send(template.html);
    }).catch((e) => {
        console.log(e)
        res.send(e);
    })
})

app.get('/:str/@:un/:permlink/service-worker.js', (req, res) => {
    var un = req.params.un;
    var permlink = req.params.permlink;
    const protocol = req.protocol;
    const host = req.hostname
    makeSW(un, permlink, req.params.str, protocol, host).then((template) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.send(template.js);
    }).catch((e) => {
        console.log(e)
        res.status(404)
    })
})

app.get('/:str/@:un/:permlink/manifest.webmanifest', (req, res) => {
    var un = req.params.un;
    var permlink = req.params.permlink;
    const protocol = req.protocol;
    const host = req.hostname
    makeManifest(un, permlink, req.params.str, protocol, host).then((template) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.send(template.js);
    }).catch((e) => {
        console.log(e)
        res.status(404)
    })
})

app.get('/:str/@:un/:permlink', (req, res) => {
    var un = req.params.un;
    var permlink = req.params.permlink;
    const protocol = req.protocol;
    const host = req.hostname
    getHiveContent(un, permlink, req.params.str, protocol, host).then((template) => {
        res.send(template.html);
    }).catch((e) => {
        console.log(e)
        res.send(e);
    })
})

app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
});

function getHiveContent(un, permlink, str, p, h){
    return new Promise((resolve, reject) => {
        var template = {
            html: `<!DOCTYPE html>
<html>
    <head>
        <title>DLUX | TITLE</title>
        <meta property="og:type" content="website">
        <meta property="og:url" content="${p}://${h}/${str}/@${un}/${permlink}">
        <meta property="og:image" content="$IMAGE">
        <meta property="og:title" content="DLUX | TITLE">
        <meta property="og:description" content="$CONTENT">
    </head>
</html>
            `,
            image: `og:image`,
            description: `og:description`
        }
        fetch(config.hapi, {
            body: `{"jsonrpc":"2.0", "method":"condenser_api.get_content", "params":["${un}", "${permlink}"], "id":1}`,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
          })
            .then((response) => response.json())
            .then((res) => {
                if(res.result?.author == un){
                    template.description = res.result.body.substring(0, 200);
                    template.title = res.result.title;
                    const json_metadata = JSON.parse(res.result.json_metadata);
                    if(json_metadata.content?.description)template.description = json_metadata.content.description;
                    if(json_metadata.video?.content?.description)template.description = json_metadata.video.content.description;
                    try {
                        template.image = json_metadata.image[0]
                        if(!template.image){
                            template.image = `${p}://${h}${config.img}`;
                        }
                    } catch (e) {
                        template.image = `${p}://${h}${config.img}`;
                    }
                    //websafe " 
                    template.description = template.description.replace(/"/g, "'");
                    template.html = template.html.replace("$IMAGE", template.image);
                    template.html = template.html.replace("$CONTENT", template.description);
                    template.html = template.html.replace(/TITLE/g, template.title);
                    resolve(template);
                } else {
                    reject("Not Found")
                }
            }).catch((e) => {
                reject(e)
            })
    })
}

function getHiveAccount(un, p, h){
    return new Promise((resolve, reject) => {
        var template = {
            html: `<!DOCTYPE html>
<html>
    <head>
        <title>DLUX | ${un}</title>
        <meta property="og:type" content="website">
        <meta property="og:url" content="${p}://${h}/@${un}">
        <meta property="og:image" content="$IMAGE">
        <meta property="og:title" content="DLUX | ${un}">
        <meta property="og:description" content="$CONTENT">
    </head>
</html>
            `,
            image: `og:image`,
            description: `og:description`
        }
        fetch(config.hapi, {
            body: `{"jsonrpc":"2.0", "method":"condenser_api.get_accounts", "params":[["${un}"]], "id":1}`,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
          })
            .then((response) => response.json())
            .then((data) => {
                var accountinfo = data.result[0];
                accountinfo.json_metadata = JSON.parse(
                    accountinfo.posting_json_metadata
                );
                template.description = accountinfo.json_metadata.profile.about;
                try {
                    template.image = accountinfo.json_metadata.profile.profile_image;
                } catch (e) {
                    template.image = `${p}://${h}${config.img}`;
                }
                //websafe " 
                template.description = template.description.replace(/"/g, "'");
                template.html = template.html.replace("$IMAGE", template.image);
                template.html = template.html.replace("$CONTENT", template.description);
                resolve(template);
            });
    })
}

function makeSW(un, permlink, str, p, h){
    return new Promise((resolve, reject) => {
        var template = {
            js: `const PRECACHE = 'precache-v1';
const RUNTIME = 'runtime';
const PRECACHE_URLS = ['index.html','ipfs/$DAPP'];
              
self.addEventListener('install', event => {
event.waitUntil(
    caches.open(PRECACHE)
    .then(cache => cache.addAll(PRECACHE_URLS))
    .then(self.skipWaiting())
);
});
self.addEventListener('activate', event => {
const currentCaches = [PRECACHE, RUNTIME];
event.waitUntil(
    caches.keys().then(cacheNames => {
    return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
    return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
    }));
    }).then(() => self.clients.claim())
);
});
self.addEventListener('fetch', event => {
if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
    caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
        return cachedResponse;
        }

        return caches.open(RUNTIME).then(cache => {
        return fetch(event.request).then(response => {
            return cache.put(event.request, response.clone()).then(() => {
            return response;
            });
        });
        });
    })
    );
}
});`,
        }
        fetch(config.hapi, {
            body: `{"jsonrpc":"2.0", "method":"condenser_api.get_content", "params":["${un}", "${permlink}"], "id":1}`,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
          })
            .then((response) => response.json())
            .then((res) => {
                if(res.result?.author == un){
                    try {
                        var metadata = JSON.parse(res.result.json_metadata)
                        var hashy = metadata.vrHash
                        if (!hashy) {
                            hashy = metadata.arHash
                        }
                        if (!hashy) {
                            hashy = metadata.appHash
                        }
                        if (!hashy) {
                            hashy = metadata.audHash
                        }
                        var assetsString = hashy;
                        for(var i = 0; i < metadata.assets.length; i++){
                            if(metadata.assets[i].hash == str && metadata.assets[i].hash != hashy){
                                assetsString += "','ipfs/" + metadata.assets[i].hash
                            }
                        }
                        template.js = template.js.replace("$DAPP", hashy);
                        resolve(template);
                    } catch (e) {
                        reject(e)
                    }
                } else {
                    reject("Not Found")
                }
            }).catch((e) => {
                reject(e)
            })
    })
}

function makeManifest(un, permlink, str, p, h){
    return new Promise((resolve, reject) => {
        var template = {
            js: `{
"$schema": "https://json.schemastore.org/web-manifest-combined.json",
"name": "TITLE",
"short_name": "DLUX-dApp",
"start_url": "https://${h}/index.html?author=${un}&permlink=${permlink}&hash=HASH",
"scope": "https://${h}/",
"display": "standalone",
"background_color": "#111222",
"theme_color": "#111222",
"description": "$CONTENT",
"icons": [{
    "src": "/img/dlux-hive-logo-alpha.svg",
    "sizes": "192x192",
    "type": "image/svg"
},
{
    "src": "/img/dlux-logo-icon.png",
    "sizes": "695x695",
    "type": "image/png",
    "purpose": "any"
},{
    "src": "/img/dlux-icon-192.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any maskable"
}
]
}`,
        }
        fetch(config.hapi, {
            body: `{"jsonrpc":"2.0", "method":"condenser_api.get_content", "params":["${un}", "${permlink}"], "id":1}`,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
          })
            .then((response) => response.json())
            .then((res) => {
                if(res.result?.author == un){
                    template.description = res.result.body.substring(0, 200);
                    template.title = res.result.title;
                    const json_metadata = JSON.parse(res.result.json_metadata);
                    if(json_metadata.content?.description)template.description = json_metadata.content.description;
                    if(json_metadata.video?.content?.description)template.description = json_metadata.video.content.description;
                    try {
                        template.image = json_metadata.image[0]
                        if(!template.image){
                            template.image = `${p}://${h}${config.img}`;
                        }
                        var hashy = json_metadata.vrHash
                        if (!hashy) {
                            hashy = json_metadata.arHash
                        }
                        if (!hashy) {
                            hashy = json_metadata.appHash
                        }
                        if (!hashy) {
                            hashy = json_metadata.audHash
                        }
                    } catch (e) {
                        template.image = `${p}://${h}${config.img}`;
                    }
                    //websafe " 
                    template.description = template.description.replace(/"/g, "'");
                    template.description = template.description.replace(/(\r\n|\n|\r)/gm, " ");
                    template.js = template.js.replace("$CONTENT", template.description);
                    template.js = template.js.replace(/TITLE/g, template.title);
                    template.js = template.js.replace("HASH", hashy);
                    resolve(template);
                } else {
                    reject("Not Found")
                }
            }).catch((e) => {
                reject(e)
            })
    })
}