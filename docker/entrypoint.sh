#!/bin/sh

set -e

if [ -z "$DOMAIN" ]; then
  1>&2 echo "ERROR: The environment variable \$DOMAIN must be set."
  exit 1
fi

cat <<EOF > src/environments/environment.prod.ts
import { BadgrEnvironment } from './badgr-environment';

export const environment: BadgrEnvironment = {
		production: true,
		config: {
			api: {
				baseUrl: "//$DOMAIN",
			},
		}
	}
;
EOF

cat <<EOF > nginx.conf
# see the configuration documentation
#    https://nginx.org/en/docs/ngx_core_module.html
worker_processes 2;
daemon off;

# log errors to stdout
# see https://stackoverflow.com/a/23328458
error_log /dev/stdout info;

events {
    worker_connections 2048;
}

http {
    server {
        listen   4000;
        server_name $DOMAIN;
        access_log off;
        root   /badgr/dist;
        location / {
            index index.html index.htm;
        }
    }
}
EOF

if [ -f dist/.app-domain ] && [ "`cat dist/.app-domain`" == "$DOMAIN" ]; then
  echo "INFO: frontend already built for $DOMAIN."
else
  echo "INFO: building the frontend for $DOMAIN."
  npm run build && echo -n "$DOMAIN" > dist/.app-domain
fi

echo "INFO: start nginx server to serve the frontend"
nginx -c nginx.conf

