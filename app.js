// External Import
var cors = require("cors");
var https = require("https");
var fs = require("fs");
var express = require("express");
var cookieParser = require("cookie-parser");
// Internal Import
var apiResponses = require("./helpers/api-response");
var indexRouter = require("./routes/index");
var apiRouter = require("./routes/api");

global.__basedir = __dirname;
var app = express();

var port = 5001;
var key, cert;

try {
  key = fs.readFileSync("/etc/letsencrypt/live/api.notaneimu.space/privkey.pem");
  cert = fs.readFileSync("/etc/letsencrypt/live/api.notaneimu.space/fullchain.pem");
} catch (err) {
  console.error('failed to read keys, read localhost fallback', err)
  key = fs.readFileSync("localhost.key").toString();
  cert = fs.readFileSync("localhost.crt").toString();
}

app.use(express.json());
app.use(cookieParser());

// To Allow Cross-Origin Requests
app.use(cors());

//Route Prefixes
app.use("/", indexRouter);
app.use("/api/", apiRouter);
app.get('/test', (req,res)=>{
  res.send("Hello from express server.")
})
app.get("/download/:file", function (req, res) {
  const file = `${__dirname}/public/uploads/${req.params.file}`;
  res.download(file);
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

//throw 404 if URL not found
app.all("*", function (req, res) {
  return apiResponses.notFoundResponse(res, "Page not found");
});

app.use((err, req, res) => {
  if (err.name === "UnauthorizedError") {
    return apiResponses.unauthorizedResponse(res, err.message);
  }
});

console.log('key:', key, 'cert:', cert)
https
  .createServer(
    { key, cert },
    app
  )
  .listen(port, () => {
    console.log("server is runing at port", port);
  });

app.maxHttpHeaderSize = 64 * 1024; // 64KB
module.exports = app;
