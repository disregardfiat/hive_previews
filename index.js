const express = require('express');
const cors = require('cors');
const config = require('./config.js');

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
                    console.log(json_metadata)
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
                    console.log({template})
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
                console.log({template})
                resolve(template);
            });
    })
}