const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
const clientKey = process.env.MIDTRANS_CLIENT_KEY?.trim();
const isPlaceholder = (value) =>
  !value || value.includes("placeholder") || value.startsWith("SB-Mid-server") && value.includes("placeholder");

if (isPlaceholder(serverKey) || isPlaceholder(clientKey)) {
  console.warn(
    "⚠️ MIDTRANS_SERVER_KEY atau MIDTRANS_CLIENT_KEY belum dikonfigurasi. Endpoint pembayaran Midtrans tidak akan berfungsi."
  );
}

const midtransClient = require("midtrans-client");

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
  serverKey: serverKey || "",
  clientKey: clientKey || "",
});

module.exports = snap;
