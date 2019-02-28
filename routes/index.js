const { Router } = require("express");
const bcrypt = require("bcrypt");
const {
  parseTrades,
  isAuthorized,
  isLoggedIn,
  loginUser,
  validateBook,
  validateRegister,
  validateLogin
} = require("./utils");
const knex = require("../db/knexInstance");
const sessionStore = require("../sessions/redis-store");

const router = Router();

router.get("/books", async (req, res, next) => {
  try {
    const books = await knex("books")
      .join("users", "users.id", "=", "books.owner_id")
      .select(
        "books.id",
        "books.owner_id",
        "books.title",
        "books.description",
        "books.created_at",
        "users.username",
        "users.location"
      );
    res.status(200).json({ books });
  } catch (e) {
    next(e);
  }
});

router.post("/books", isLoggedIn, validateBook, async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const createdAt = new Date().toUTCString();
    const updatedAt = createdAt;
    const { userId } = req.session;
    const [book] = await knex("books")
      .insert({ title, description, created_at: createdAt, updated_at: updatedAt, owner_id: userId })
      .returning("*");

    res.status(200).json({ ...book });
  } catch (e) {
    next(e);
  }
});

router.delete("/books", isLoggedIn, isAuthorized, async (req, res, next) => {
  try {
    const hasBook = await knex("trades")
      .select("trades_books.book_id")
      .join("trades_books", "trades_books.trade_id", "=", "trades.id")
      .where("trades_books.book_id", req.body.bookId)
      .andWhere("trades.state", "requested");

    if (hasBook.length > 0) {
      const error = new Error("You cannot delete this book as it is requested in a trade.");
      error.status = 422;
      throw error;
    } else {
      const ids = await knex("trades_books")
        .where("book_id", req.body.bookId)
        .del()
        .returning("trade_id");

      if (ids && ids.length > 0) {
        await knex("trades_books")
          .whereIn("trade_id", ids)
          .del();
        await knex("trades")
          .whereIn("id", ids)
          .del();
      }

      await knex("books")
        .where("id", req.body.bookId)
        .del();
    }

    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

router.post(
  "/register",
  validateRegister,
  async (req, res, next) => {
    try {
      const { username, password, email, location } = req.body;
      const hash = await bcrypt.hash(password, 10);
      const created_at = new Date().toUTCString();
      const updated_at = created_at;
      const [user] = await knex("users")
        .insert({
          username,
          password: hash,
          email,
          location,
          created_at,
          updated_at
        })
        .returning("*");
      res.status(200).json({ user });
    } catch (e) {
      next(e);
    }
  },
  loginUser
);

router.post("/login", validateLogin, loginUser);
router.post("/logout", async (req, res, next) => {
  try {
    const fakeCookie = `${req.get("Cookie")}; Path=/; HttpOnly; expires=Thu, Jan 01 1970 00:00:00 UTC;`;
    const sessionId = req.session.id;
    sessionStore.destroy(sessionId, err => {
      if (err) {
        throw err;
      }
      res.set({ "Set-Cookie": fakeCookie });
      res.status(204).end();
    });
  } catch (e) {
    next(e);
  }
});

router.get("/sessions", async (req, res, next) => {
  try {
    if (req.session.userId) {
      const [user] = await knex("users")
        .select("username", "email", "id", "location")
        .where("id", req.session.userId);
      res.status(200).json({ ...user });
    } else {
      const error = new Error("No logged in user found");
      error.status = 404;
      throw error;
    }
  } catch (e) {
    next(e);
  }
});

router.get("/requests", async (req, res, next) => {
  try {
    const result = await knex("trades")
      .select(
        "trades.id as trade_id",
        "books.title",
        "books.description",
        "books.id as book_id",
        "users.username",
        "users.id as owner_id",
        "trades_books.direction"
      )
      .join("trades_books", "trades_books.trade_id", "=", "trades.id")
      .join("books", "trades_books.book_id", "=", "books.id")
      .join("users", "users.id", "=", "books.owner_id")
      .where("trades.state", "requested");

    const requests = parseTrades(result);
    res.status(200).json({ requests });
  } catch (e) {
    console.log(e);
    next(e);
  }
});

router.post("/requests", isLoggedIn, async (req, res, next) => {
  const { booksTaken, booksGiven } = req.body;
  try {
    const ownerIds = await knex("books")
      .select("owner_id")
      .whereIn("id", booksGiven);

    const isOwner = ownerIds.every(item => item.owner_id === req.session.userId);
    if (!isOwner) {
      const error = new Error("You are not the owner of the book(s) you want to trade.");
      error.status = 401;
      throw error;
    }

    const isSameOwner = booksTaken.every((b, i, arr) => b.ownerId === arr[0].ownerId);
    if (!isSameOwner) {
      const error = new Error("Books requested to be taken have to belong to same owner");
      error.status = 422;
      throw error;
    }

    const now = new Date().toUTCString();
    await knex.transaction(async trx => {
      knex("trades")
        .transacting(trx)
        .insert({
          state: "requested",
          created_at: now,
          updated_at: now
        })
        .returning("id")
        .then(async ([tradeId]) => {
          const toBooks = booksGiven.map(b => ({
            direction: "to",
            book_id: b,
            trade_id: tradeId,
            created_at: now,
            owner_id: req.session.userId
          }));
          const fromBooks = booksTaken.map(b => ({
            direction: "from",
            book_id: b.id,
            trade_id: tradeId,
            created_at: now,
            owner_id: booksTaken[0].ownerId
          }));
          const tradeBooks = [...toBooks, ...fromBooks];
          return knex.batchInsert("trades_books", tradeBooks);
        })
        .then(trx.commit)
        .catch(trx.rollback);
    });

    res.status(201).end();
  } catch (e) {
    next(e);
  }
});

router.put("/requests", isLoggedIn, async (req, res, next) => {
  try {
    const now = new Date().toUTCString();
    await knex.transaction(async trx => {
      knex("trades")
        .transacting(trx)
        .where("trades.id", req.body.tradeId)
        .update({ state: "accepted", updated_at: now })
        .then(async () =>
          knex("trades")
            .select("trades_books.book_id")
            .join("trades_books", "trades.id", "=", "trades_books.trade_id")
            .where("trades.id", req.body.tradeId)
        )
        .then(async resp => {
          const books = resp.map(b => b.book_id);
          const cancelledTrades = await knex("trades")
            .select("trades.id")
            .join("trades_books", "trades_books.trade_id", "=", "trades.id")
            .whereIn("trades_books.book_id", books)
            .whereNot("trades_books.trade_id", req.body.tradeId);
          const cancelledTradeIds = cancelledTrades.map(trade => trade.id);

          await knex("trades")
            .update({ state: "cancelled" })
            .whereIn("id", cancelledTradeIds)
            .whereNot("id", req.body.tradeId)
            .andWhere("state", "requested");

          const result = await knex("trades")
            .select("trades_books.owner_id", "trades_books.direction")
            .join("trades_books", "trades_books.trade_id", "=", "trades.id")
            .where("trades_books.trade_id", req.body.tradeId);

          const ids = {};
          result
            .reduce((acc, elm) => acc.concat(acc.find(el => el.direction === elm.direction) ? [] : [elm]), [])
            .map(elm => ({ [`${elm.direction}_owner_id`]: elm.owner_id }))
            .forEach(elm => {
              Object.keys(elm).forEach(key => {
                if (!ids[key]) {
                  ids[key] = elm[key];
                }
              });
            });
          return ids;
        })
        .then(async ({ to_owner_id: toOwnerId, from_owner_id: fromOwnerId }) => {
          const tradeBooks = await knex("trades")
            .join("trades_books", "trades.id", "=", "trades_books.trade_id")
            .select("trades_books.book_id", "trades_books.direction")
            .where("trades.id", req.body.tradeId);

          const queries = [];
          tradeBooks.forEach(book => {
            const query = knex("books")
              .where("id", book.book_id)
              .update({ owner_id: book.direction === "to" ? fromOwnerId : toOwnerId, updated_at: now });
            queries.push(query);
          });

          return Promise.all(queries);
        })
        .then(trx.commit)
        .catch(trx.rollback);
    });
    res.status(200).end();
  } catch (e) {
    next(e);
  }
});

router.get("/requests/new", isLoggedIn, async (req, res, next) => {
  try {
    const userBooks = await knex("books")
      .select("title", "id", "description")
      .where("owner_id", req.session.userId);

    const otherBooks = await knex("books")
      .select("books.title", "books.id", "books.owner_id", "books.description", "users.username")
      .join("users", "users.id", "=", "books.owner_id")
      .whereNot("books.owner_id", req.session.userId);
    res.status(200).json({ userBooks, otherBooks });
  } catch (e) {
    next(e);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const users = await knex("users").select("username", "location", "id");
    res.status(200).json({ users });
  } catch (e) {
    next(e);
  }
});

router.get("/trades", async (req, res, next) => {
  try {
    const result = await knex("trades")
      .select(
        "trades.id as trade_id",
        "books.title",
        "books.description",
        "books.id as book_id",
        "users.username",
        "users.id as owner_id",
        "trades_books.direction"
      )
      .join("trades_books", "trades_books.trade_id", "=", "trades.id")
      .join("books", "trades_books.book_id", "=", "books.id")
      .join("users", "users.id", "=", "trades_books.owner_id")
      .where("trades.state", "accepted");

    const trades = parseTrades(result);
    res.status(200).json({ trades });
  } catch (e) {
    next(e);
  }
});

router.get("/me", isLoggedIn, async (req, res, next) => {
  try {
    const { userId } = req.session;
    const result = await knex("users")
      .select("users.username", "books.title", "books.description", "users.location", "books.created_at", "books.id")
      .join("books", "books.owner_id", "=", userId)
      .where("users.id", userId);

    let books = [];
    let requests = [];
    let user;
    if (result.length > 0) {
      books = result.map(item => ({
        created_at: item.created_at,
        title: item.title,
        description: item.description,
        id: item.id
      }));
      user = { username: result[0].username, location: result[0].location };

      const resp = await knex("trades")
        .select(
          "trades.id as trade_id",
          "books.title",
          "books.description",
          "books.id as book_id",
          "users.username",
          "users.id as owner_id",
          "trades_books.direction"
        )
        .join("trades_books", "trades_books.trade_id", "=", "trades.id")
        .join("books", "trades_books.book_id", "=", "books.id")
        .join("users", "users.id", "=", "trades_books.owner_id")
        .where("trades.state", "requested");

      const hasPending = resp.find(el => el.direction === "from" && el.owner_id === userId);
      if (hasPending) {
        requests = parseTrades(resp);
      }
    } else {
      [user] = await knex("users").select("username", "location");
    }

    res.status(200).json({ books, user, requests });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
