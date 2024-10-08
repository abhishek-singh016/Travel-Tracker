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

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries");
    let countries = [];

    result.rows.forEach((country) => {
      countries.push(country.country_code);
    });
    return countries;
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const color = '#008080'
  res.render("index.ejs", {countries: countries, total: countries.length, color: color});
});

app.post("/add", async (req, res) => {
  const countryName = req.body["country"];
  console.log(countryName);
  try {
    const resultedCountryCode = await db.query(
      `SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';`,
      [countryName.toLowerCase()]
    );

    const data = resultedCountryCode.rows[0];
    let countryCode = data.country_code;
    if(countryCode === 'IO'){
      countryCode = 'IN';
    }

    try {
      await db.query(
        `INSERT INTO visited_countries (country_code) VALUES ($1)`,
        [countryCode]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
      const countries = await checkVisisted();
      res.render("index.ejs",{
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again.",
      });
    } 
    
  } catch (err) {
    console.log(err);
    const countries = await checkVisisted();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country name does not exist, try again.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});