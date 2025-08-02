# Docker image tags

The individual Papermerge services, can be executed in Docker containers. To retain version compatibility, use only the listed image tags for Papermerge versions.

## Papermerge versions

The listed versions have been tested. Other combinations might work as well, but can cause side effects, that are not supported by Papermerge.

| Papermerge Version | Papermerge | Auth Server<br>(used only internally) |OCR Worker | Path Template Worker | S3 Worker | i3 Worker | DB |  Redis | Solr |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [**3.5.2**](https://github.com/papermerge/papermerge-core/releases/tag/3.5.2) | papermerge/papermerge:3.5.2 | papermerge/auth-server:1.1.3 |papermerge/ocrworker:0.3.1 | papermerge/path-tmpl-worker:0.4 | papermerge/s3worker:0.5 | papermerge/i3worker:0.3 |  postgres:16.1 | bitname-redis:7.2 | solr:9.7 |
| [**3.4.1**](https://github.com/papermerge/papermerge-core/releases/tag/3.4.1) | papermerge/papermerge:3.4.1 | papermerge/auth-server:1.0.2 | papermerge/ocrworker:0.3.1 | papermerge/path-tmpl-worker:0.3.2 | papermerge/s3worker:0.4.3 | papermerge/i3worker:0.3 | postgres:16.1 | bitname-redis:7.2 | solr:9.7 |

**Table 1:** Papermerge container image version matrix

### Images on Docker Hub

#### papermerge

- [papermerge/papermerge](https://hub.docker.com/r/papermerge/papermerge/tags)
- [papermerge/auth-server](https://hub.docker.com/r/papermerge/auth-server)
- [papermerge/ocrworker](https://hub.docker.com/r/papermerge/ocrworker)
- [papermerge/path-tmpl-worker](https://hub.docker.com/r/papermerge/path-tmpl-worker)
- [papermerge/s3worker](https://hub.docker.com/r/papermerge/s3worker)
- [papermerge/i3worker](https://hub.docker.com/r/papermerge/i3worker)

#### 3rd party

- [PostgreSQL](https://hub.docker.com/_/postgres)
- [Redis](https://hub.docker.com/_/redis)
- [Solr](https://hub.docker.com/_/solr)
