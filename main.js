document.addEventListener("DOMContentLoaded", function () {
  document.body.addEventListener("htmx:afterOnLoad", handleAfterOnLoad);
  document.body.addEventListener("click", handleBodyClick);
  document
    .getElementById("orderType")
    .addEventListener("change", handleOrderTypeChange);

  document.body.addEventListener("htmx:configRequest", async function (event) {
    if (event.target.getAttribute("hx-target") === "#account-info") {
      console.log("Setting up keys...");
      await handleKeys(event);
      handleAccountInfoRequest(event);
    }

    if (event.target.getAttribute("hx-target") === "#account-info-container") {
      console.log("Setting up request...");
      handleAccountInfoRequest(event);
    }

    if (event.target.getAttribute("hx-target") === "#trg") {
      console.log(event.detail);
      event.detail.parameters["privkey"] =
        window.localStorage.getItem("private-key");
    }
  });

  async function handleKeys(event) {
    window.localStorage.setItem("private-key", "");
    window.localStorage.setItem("public-key", "");
    window.localStorage.setItem("trg-key", "");

    console.log("Getting keys...");
    const privkey = JSON.parse(document.getElementById("privkey").value);
    const trgkey = document.getElementById("trgkey").value;
    const { publickey, isTrgValid } = await fetchPublicKey(privkey, trgkey);
    console.table({ publickey, isTrgValid });

    if (publickey === "Error") {
      console.log("Error, wrong privatekey...");
      privkey = "Error: private key array is not valid";
      return;
    }

    console.log("Setting keys...");
    // Set Keys
    window.localStorage.setItem("private-key", JSON.stringify(privkey));
    document.getElementById("privkey").value = "";
    console.log("Private Key set...");

    window.localStorage.setItem("public-key", JSON.stringify(publickey));
    console.log("Public Key set...");

    console.log("Is Trg Valid:", isTrgValid);

    if (isTrgValid) {
      document.getElementById("trgkey").value = "";
      window.localStorage.setItem("trg-key", trgkey);
      console.log("Trg Key set...");
    } else {
      document.getElementById("trgkey").placeholder = "No TRG Key inserted...";
      window.localStorage.setItem("trg-key", "NaN");
      console.log("No TRG Key to set...");
    }

    console.log("Finished setting keys...");

    return;
  }

  function handleAccountInfoRequest(event) {
    console.log("Handling request to server for account info...");
    event.detail.parameters["pubkey"] =
      window.localStorage.getItem("public-key");
    event.detail.parameters["privkey"] =
      window.localStorage.getItem("private-key");
    event.detail.parameters["trgkey"] = window.localStorage.getItem("trg-key");
    console.table({
      trg: event.detail.parameters["trgkey"],
      priv: event.detail.parameters["privkey"],
      pub: event.detail.parameters["pubkey"],
    });
    console.log("Making request...", event);
  }

  function handleAfterOnLoad(event) {
    if (event.target.getAttribute("hx-target") === "#orderbook") {
      const data = JSON.parse(event.detail.xhr.responseText);
      const content = buildOrderBookContent(data);
      document.getElementById("orderbook").innerHTML = content;
    }
  }

  function handleBodyClick(event) {
    if (event.target.getAttribute("hx-target") === "#confirmation") {
      clearConfirmation();
    }

    if (event.target.closest(".bid, .ask")) {
      setLimitPrice(event);
    }

    if (event.target.getAttribute("hx-target") === "#bracket-fields") {
      toggleBracketFields(event);
    }
  }

  function handleOrderTypeChange(event) {
    const selectedType = event.target.value;
    console.log(selectedType);
    if (selectedType === "limit") {
      document.getElementById(
        "limit"
      ).innerHTML = `<label>Limit Price:</label><input type="number" id="limit-price" placeholder="Enter limit price..." /><p class="tip">Tip: click on a price level on the orderbook to select a price faster</p>`;
    } else {
      document.getElementById("limit").innerHTML = "";
    }
  }

  function buildOrderBookContent(data) {
    let content = `<h3>BTCUSD-PERP: $ ${data.markPrice.toLocaleString(
      "en"
    )}</h3>`;
    content += "<h4>Bids & Asks</h4>";
    content += "<div class='orderbook-wrapper'>";
    content += buildBidsContent(data.bids);
    content += buildAsksContent(data.asks);
    content += "</div>";
    return content;
  }

  function buildBidsContent(bids) {
    let content =
      "<table class='orderbook-table bids'><thead><tr><th>Size</th><th>Price</th></tr></thead><tbody>";
    for (let bid of bids) {
      content += `<tr class="bid" data-price="${
        bid.price
      }" hx-target="#limit-price"><td>${
        bid.ordersSize
      }</td><td>$ ${bid.price.toLocaleString("en")}</td></tr>`;
    }
    content += "</tbody></table>";
    return content;
  }

  function buildAsksContent(asks) {
    const sortedAsks = asks.sort((a, b) => Number(a.price) - Number(b.price));
    let content =
      "<table class='orderbook-table asks'><thead><tr><th>Price</th><th>Size</th></tr></thead><tbody>";
    for (let ask of sortedAsks) {
      content += `<tr class="ask" data-price="${
        ask.price
      }" hx-target="#limit-price"><td>$ ${ask.price.toLocaleString(
        "en"
      )}</td><td>${ask.ordersSize}</td></tr>`;
    }
    content += "</tbody></table>";
    return content;
  }

  async function fetchPublicKey(privkey, trgkey) {
    const response = await fetch("http://localhost:3000/public-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ privkey, trgkey }),
    });
    const data = await response.json();
    return { publickey: data.publickey, isTrgValid: data.isTrgValid };
  }

  function clearConfirmation() {
    setInterval(() => {
      document.getElementById("confirmation").innerHTML = "";
    }, 3500);
  }

  function setLimitPrice(event) {
    const priceRow = event.target.closest(".bid, .ask");
    const price = priceRow.getAttribute("data-price");
    console.log(price);
    if (Number(price)) {
      document.getElementById("limit-price").value = price;
    }
  }

  function toggleBracketFields(event) {
    console.log(event.target.checked);
    if (event.target.checked) {
      document.getElementById(
        "bracket-fields"
      ).innerHTML = `<label>Take-profit price:</label><input type="number" id="orderSize" placeholder="Enter price..." /><label>Stop-loss price:</label><input type="number" id="orderSize" placeholder="Enter price..." />`;
    } else {
      document.getElementById("bracket-fields").innerHTML = "";
    }
  }
});
