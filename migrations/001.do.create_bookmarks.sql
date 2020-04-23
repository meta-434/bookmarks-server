CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE bookmarks (
    id uuid DEFAULT uuid_generate_v4 (),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    rating INTEGER NOT NULL,
    PRIMARY KEY (id)
);