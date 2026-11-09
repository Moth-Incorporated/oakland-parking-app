import "dotenv/config";
import express from "express";
import parkingSearch from "./parking-search/routes.js";

const app = express();

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api", parkingSearch);

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
