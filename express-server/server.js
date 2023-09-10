const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { formatAccountToHTMLComponent } = require("./components");
const { returnPublicKey, isValidSolanaPubkey } = require("./utility");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static("public")); // serves static files from the 'public' directory
app.use(cors());

// Routes
app.get("/", sendLoadingResponse);
app.post("/public-key", getPublicKey);
app.post("/account-info", getAccountInfo);
app.get("/order", createOrder);
app.post("/create-trg", createTrg);

app.listen(PORT, startServer);

const FLOW_API = "https://api-client.flowmatic.xyz/api";

// Handlers
function sendLoadingResponse(req, res) {
  res.send("Loading...");
}

function getPublicKey(req, res) {
  try {
    console.log("Received request body:", req.body);

    if (!req.body.privkey) {
      throw new Error("Private key not provided or has an invalid format");
    }

    const publickey = returnPublicKey(req.body.privkey);

    const isTrgValid = isValidSolanaPubkey(req.body.trgkey);

    res.json({ publickey, isTrgValid });
  } catch (error) {
    handleError(res, error);
  }
}

async function getAccountInfo(req, res) {
  try {
    console.log("Received request body:");

    const privkey = JSON.parse(req.body.privkey);
    const trgkey = req.body.trgkey;
    const pubkey = req.body.pubkey;

    console.log({
      privkey: JSON.parse(req.body.privkey),
      trgkey: req.body.trgkey,
      pubkey: req.body.pubkey,
    });

    if (!privkey) {
      throw new Error("Private key not provided or has an invalid format");
    }

    if (trgkey === "NaN") {
      res.send(
        `<div>Account: ${pubkey}</div><div id="trg">TRG: <button hx-post="http://localhost:3000/create-trg" hx-target="#trg" hx-trigger="click" >Create TRG</button></div>`
      );
      return;
    }

    const response = await fetch(`${FLOW_API}/account-info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ privateKey: privkey, trgPubkey: trgkey }),
    });

    const data = await response.json();
    const html = formatAccountToHTMLComponent(data.message);

    res.send(html);
  } catch (error) {
    handleError(res, error);
  }
}

async function createTrg(req, res) {
  try {
    console.log("Received request body (Create TRG):", req.body);

    if (!req.body.privkey) {
      throw new Error("Private key not provided or has an invalid format");
    }

    const response = await fetch(`${FLOW_API}/create-trg`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: req.body.privkey,
    });

    const data = await response.json();

    res.send(`<p>TRG: ${data.trgPubkey}</p>`);
  } catch (error) {
    handleError(res, error);
  }
}

function createOrder(req, res) {
  try {
    const side = req.query.side;

    if (!side || (side !== "buy" && side !== "sell")) {
      throw new Error("Invalid side provided. Must be 'buy' or 'sell'.");
    }

    res.send(`<p>${side === "buy" ? "Bought" : "Sold"}</p>`);
  } catch (error) {
    handleError(res, error);
  }
}

function handleError(res, error) {
  console.error("Error while processing request:", error.message);
  res.status(400).send(error.message);
}

function startServer() {
  console.log(`Server is running on http://localhost:${PORT}`);
}
