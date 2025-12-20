-- Initialize databases for Papermerge and Keycloak

-- Database for Papermerge
CREATE USER papermerge WITH PASSWORD 'papermerge';
CREATE DATABASE papermerge OWNER papermerge;

-- Database for Keycloak
CREATE USER keycloak WITH PASSWORD 'keycloak';
CREATE DATABASE keycloak OWNER keycloak;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE papermerge TO papermerge;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;
