const express = require("express");
const redis = require("redis");
const VALIDATORS = require("./validators"); //Import validation module

/* ---------------------- Initializing app requirements --------------------- */

const app = express();
const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const client = redis.createClient(REDIS_PORT);

/* ------- Setting up middlewares for parsing JSON and error handling ------- */

app.use(express.json());

app.use((err, req, res, next) => {
  if (err) {
    res.json({ message: "", error: "Invalid JSON object" });
  } else {
    next();
  }
});

/* ------------------------------ Setting up middlewares for redis cache, limit checking and STOP requests ------------------------------ */

//Set cache on input, and handle STOP requests
const setCache = async (req, res, next) => {
  const { to, from, text } = req.body;
  if (
    text === "STOP" ||
    text === "STOP\r" ||
    text === "STOP\r\n" ||
    text === "STOP\n"
  ) {
    console.log("STOP recieved");
    await client.setex(from, 14400, to);
  }
  next();
};

//Check cache for rate limiting, and hande STOP requests
const checkCache = async (req, res, next) => {
  const { to, from } = req.body;
  const value = await client.exists(from, async (err, ok) => {
    if (err) throw err;
    if (ok === 1) {
      return res.status(400).json({
        message: "",
        error: `sms from <${from}> to <${to}> blocked by STOP request`,
      });
    }
    await client.exists(`${from}:count`, async (err, ok) => {
      if (err) throw err;
      console.log("CHECKING EXITENCE: ", ok);
      if (ok === 1) {
        client.incr(`${from}:count`, (err, ok) => {
          if (err) throw err;
          console.log("INCREMENTING");
          if (ok >= 5) {
            return res
              .status(400)
              .json({ message: "", error: `limit reached for <${from}>` });
          }
          return next();
        });
      } else {
        await client.setex(`${from}:count`, 20, 0);
        console.log("STARTING COUNTER");
        return next();
      }
    });
  });
};

/* ----------------------------------------------------------- Main app routes ----------------------------------------------------------- */

app.post("/inbound/sms", setCache, (req, res) => {
  try {
    const requiredParams = VALIDATORS.GENERAL.paramsExist(req.body);
    if (requiredParams.error) return res.status(400).json(requiredParams);

    const validatedParams = VALIDATORS.GENERAL.paramValidation(req.body);
    if (validatedParams.error) return res.status(400).json(validatedParams);
  } catch (err) {
    return res.status(500).json({ message: "", error: "unknown failure" });
  }

  return res.status(200).json({ message: "inbound sms is ok", error: "" });
});

app.post("/outbound/sms", checkCache, (req, res) => {
  try {
    const requiredParams = VALIDATORS.GENERAL.paramsExist(req.body);
    if (requiredParams.error) return res.status(400).json(requiredParams);

    const validatedParams = VALIDATORS.GENERAL.paramValidation(req.body);
    if (validatedParams.error) return res.status(400).json(validatedParams);
  } catch (err) {
    return res.status(500).json({ message: "", error: "unknown failure" });
  }

  return res.status(200).json({ message: "outboound sms is ok", error: "" });
});

app.get("/", (req, res) => {
  res.status(405).json({ message: "", error: "Page doesn't exist" });
});

app.post("/", (req, res) => {
  res.status(405).json({ message: "", error: "Page doesn't exist" });
});

/* -------------------------------------------------------------- Listening ------------------------------------------------------------- */

app.listen(PORT, () => console.log("Server listening on PORT " + PORT));
