-- DROP DATABASE IF exists dougtv;
-- CREATE DATABASE dougtv;
-- \c dougtv;

-- DROP TABLE IF exists broadcasters; 
-- DROP DATABASE IF exists dougtv;
CREATE DATABASE dougtv;  
-- \c dougtv;
CREATE TABLE broadcasters (
    id SERIAL PRIMARY KEY,
    socket_id VARCHAR,
    username VARCHAR,
    broadcaster_active BOOLEAN DEFAULT TRUE
);
