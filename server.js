const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const path = require("path");

const usersRoutes = require("./routes/api");
const profilesRoutes = require("./routes/api/profiles");
// const articles = require("./routes/api/articles");

const app = express();

// Body Parser Middleware
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// DB Config
const db = require("./config/keys").mongoUri;

// Connect to MongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true }
  )
  .then(() => console.log("MongoDB Connected"))
  .catch(() => console.log("Error connecting to MongoDB"));

// Passport Middleware
app.use(passport.initialize());

// Passport Config
require("./config/passport");

// Use Routes
app.use("/api/auth", usersRoutes);
app.use("/api/profiles", profilesRoutes);
// app.use("/api/articles", articles);

const port = process.env.PORT || 5000;

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log("Server running on port: " + port);
});
