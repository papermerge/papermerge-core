FROM redocly/redoc

ENV SPEC_URL=swagger.yaml

COPY docker/openapi-schema.yml /usr/share/nginx/html/swagger.yaml

# HTTP static content is exposed on port 80
# Example of usage:
#
# docker run -p 9000:80 papermerge/redoc:2.1.0-alpha8