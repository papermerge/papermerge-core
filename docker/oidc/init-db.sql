-- Initialize databases for Papermerge and Keycloak

-- Database for Papermerge
CREATE USER pm WITH PASSWORD 'pm';
CREATE DATABASE pmdb OWNER pm;

-- Database for Keycloak
CREATE USER keycloak WITH PASSWORD 'keycloak';
CREATE DATABASE keycloak OWNER keycloak;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE pmdb TO pm;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;
