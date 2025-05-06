import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "0993612229zx",
  port: 5432
})
db.connect();


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
try {
  app.get("/", async (req, res) => {
    const countries = await checkVisisted();
    res.render("index.ejs", { countries: countries, total: countries.length });
  });
  app.post("/add", async (req, res) => {
    const input = req.body["country"];

    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    if (result.rows.length !== 0) {
      const data = result.rows[0];
      const countryCode = data.country_code;

      const checkDuplicate = await db.query("SELECT * FROM visited_countries WHERE country_code = $1", [
        countryCode,
      ]);

      if (checkDuplicate.rows.length > 0) {
        return res.status(400).send(`${input} already exists in the database`);
      }
      await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [
        countryCode,
      ])
      res.redirect("/");
    } else {
      res.status(400).send("Country not found");
    }
  })
} catch (err) {
  console.error("Error executing query", err.stack);
  res.status(500).send("Internal Server Error");
}


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
