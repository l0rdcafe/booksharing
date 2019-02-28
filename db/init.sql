DROP TYPE IF EXISTS state;
DROP TYPE IF EXISTS direction;
CREATE TYPE state AS ENUM ('requested', 'accepted', 'cancelled');
CREATE TYPE direction AS ENUM ('from', 'to');

CREATE TABLE IF NOT EXISTS users
  (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
  );

CREATE TABLE IF NOT EXISTS books
  (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
  );

CREATE TABLE IF NOT EXISTS trades
  (
    id SERIAL PRIMARY KEY,
    state state NOT NULL,
    updated_at TIMESTAMP,
    created_at TIMESTAMP
  );

CREATE TABLE IF NOT EXISTS trades_books
  (
    id SERIAL PRIMARY KEY,
    trade_id INTEGER NOT NULL REFERENCES trades(id),
    book_id INTEGER NOT NULL REFERENCES books(id),
    owner_id INTEGER NOT NULL REFERENCES users(id),
    direction direction NOT NULL,
    created_at TIMESTAMP,
    UNIQUE (trade_id, book_id)
  );

CREATE INDEX IF NOT EXISTS idx_trade_id ON trades_books(trade_id);
