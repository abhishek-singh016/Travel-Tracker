import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

// Connect to the database
(async () => {
  try {
    await db.connect();
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Failed to connect to the database", err.stack);
  }
})();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT country_code FROM visited_countries");
    let total = 0;
    let countries = [];

    result.rows.forEach((country) => {
      countries.push(country.country_code);
      total++;
    });

    res.render("index.ejs", { countries: countries, total: total });
  } catch (err) {
    console.error("Error executing queries", err.stack);
    res.status(500).send("Server error");
  }
});

app.post("/add", async (req, res) => {
  try {
    const countryName = req.body["country"];
    console.log(countryName);

    const resultedCountryCode = await db.query(
      `SELECT country_code FROM countries WHERE country_name = $1`,
      [countryName]
    );

    if (resultedCountryCode.rows.length !== 0) {
      const data = resultedCountryCode.rows[0];
      const countryCode = data.country_code;

      await db.query(
        `INSERT INTO visited_countries (country_code) VALUES ($1)`,
        [countryCode]
      );
      res.redirect("/");
    } else {
      res.status(404).send("Country not found");
    }
  } catch (error) {
    console.error("Error processing request", error);
    res.status(500).send({ error: "An unexpected error occurred." });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
