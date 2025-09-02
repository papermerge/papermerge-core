FROM node:24.7 AS frontend_build
# ensure all packages are up-to-date
RUN apt update && apt upgrade -y && rm -rf /var/cache/apk/*

WORKDIR /build_frontend_app
COPY frontend/ .
RUN yarn install
RUN yarn workspace @papermerge/hooks build
RUN yarn workspace ui build

FROM nginx:alpine

# Copy production build to nginx folder
COPY --from=frontend_build /build_frontend_app/apps/ui/dist /usr/share/nginx/html

# Replace default nginx config
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
