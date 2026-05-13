import "dotenv/config";

import express from "express";
import path from "path";
import session from "express-session";
import { fileURLToPath } from "url";

import db from "./config/db.js";
import webRoutes from "./routes/web.js";

const app = express();

// ======================
// __dirname Fix
// ======================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================
// Middlewares
// ======================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static Files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ======================
// View Engine
// ======================

app.set("view engine", "ejs");

// ======================
// Session
// ======================

app.use(
  session({
    secret: "viral-secret-key",
    resave: false,
    saveUninitialized: false,
  }),
);

// ======================
// Routes
// ======================
app.use(async (req, res, next) => {
  try {
    // Settings
    const [settings] = await db.query(
      `
                SELECT *
                FROM site_settings

                ORDER BY id DESC
                LIMIT 1
                `,
    );

    // Global EJS Variable
    res.locals.settings = settings[0] || {};

    // Logged User
    res.locals.user = req.session.user || null;

    next();
  } catch (err) {
    console.log(err);

    next();
  }
});

app.use("/", webRoutes);

// ======================
// Server
// ======================

const port = process.env.PORT || 3009;

app.listen(port, () => {
  console.log(`🚀 Server active on port ${port}`);
});
