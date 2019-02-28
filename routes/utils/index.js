const bcrypt = require("bcrypt");
const knex = require("../../db/knexInstance");
const sessionStore = require("../../sessions/redis-store");

exports.isAuthorized = async (req, res, next) => {
  try {
    const [{ owner_id: ownerId }] = await knex("books")
      .select("owner_id")
      .where("id", req.body.bookId);

    if (req.session.userId !== ownerId) {
      const error = new Error("You cannot delete this book as you are not its owner");
      error.status = 401;
      throw error;
    }
    next();
  } catch (e) {
    next(e);
  }
};

exports.isLoggedIn = (req, res, next) => {
  if (!req.session.userId) {
    const error = new Error("You are unauthorized to perform this action");
    error.status = 401;
    throw error;
  }
  next();
};

exports.loginUser = async (req, res, next) => {
  try {
    const { username, email, password: pw } = req.body;
    const result = await knex("users")
      .select("*")
      .where("username", username)
      .andWhere("email", email);

    if (result.length === 0) {
      const error = new Error("User not found");
      error.status = 400;
      throw error;
    }

    const [user] = result;
    const isValidPassword = await bcrypt.compare(pw, user.password);
    if (!isValidPassword) {
      const error = new Error("Wrong password");
      error.status = 400;
      throw error;
    }

    req.session.userId = user.id;
    sessionStore.set(req.session.id, req.session, err => {
      if (err) {
        return next(err);
      }
      res
        .status(200)
        .json({ username: user.username, email: user.email, id: user.id, location: user.location || null });
    });
  } catch (e) {
    next(e);
  }
};

exports.validateBook = (req, res, next) => {
  req.sanitizeBody("title");
  req.sanitizeBody("description");
  req.checkBody("title", "Book title must be provided").notEmpty();
  req.checkBody("description", "Book description must be provided").notEmpty();

  const errors = req.validationErrors();
  if (errors) {
    const error = new Error(errors[0]);
    error.status = 400;
    throw error;
  }
  next();
};

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody("username");
  req.sanitizeBody("password");
  req.sanitizeBody("confirmPassword");
  req.sanitizeBody("email");
  req.sanitizeBody("location");
  req.checkBody("username", "No username provided").notEmpty();
  req.checkBody("password", "No password provided").notEmpty();
  req.checkBody("confirmPassword", "Password confirmation not provided").notEmpty();
  req.checkBody("email", "No email address provided").notEmpty();
  req.checkBody("email", "Invalid email address provided").isEmail();
  req.checkBody("confirmPassword", "Passwords do not match").equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    const error = new Error(errors[0]);
    error.status = 400;
    throw error;
  }
  next();
};

exports.validateLogin = (req, res, next) => {
  req.checkBody("username", "No username provided").notEmpty();
  req.checkBody("email", "No email address provided").notEmpty();
  req.checkBody("email", "Invalid email address provided").isEmail();
  req.checkBody("password", "No password provided").notEmpty();
  req.sanitizeBody("username");
  req.sanitizeBody("email");
  req.sanitizeBody("password");

  const errors = req.validationErrors();
  if (errors) {
    const error = new Error(errors[0]);
    error.status = 400;
    throw error;
  }
  next();
};

exports.parseTrades = arr => {
  const result = [];
  arr.forEach(item => {
    let element = result.find(el => el.tradeId === item.trade_id);
    if (!element) {
      element = {
        tradeId: item.trade_id,
        [item.direction]: {
          username: item.username,
          ownerId: item.owner_id,
          books: [{ title: item.title, description: item.description, bookId: item.book_id }]
        }
      };
      result.push(element);
    } else if (element[item.direction]) {
      element[item.direction].books.push({ title: item.title, description: item.description, bookId: item.book_id });
    } else {
      element[item.direction] = {
        username: item.username,
        ownerId: item.owner_id,
        books: [{ title: item.title, description: item.description, bookId: item.book_id }]
      };
    }
  });
  return result;
};
