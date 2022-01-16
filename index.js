const axios = require("axios");
const cheerio = require("cheerio");
const file = require("fs");
const data = require("./data.json");
const app = require("express")();
const NodeCache = require("node-cache");
const myCache = new NodeCache({ stdTTL: 180 });

function prepareData() {
  const data = {};
  axios
    .get("https://www.chessgames.com/chessecohelp.html")
    .then((response) => {
      // get the data from the url
      const $ = cheerio.load(response.data);
      // get the data from the table
      $("tbody tr").each((i, el) => {
        const code_name = el.children[0].children[0].children[0].data;
        const move_name =
          el.children[1].children[0].children[0].children[0].data;

        const code_value =
          el.children[1].children[0].children[3].children[0].data;
        data[code_name] = {
          move_name,
          code_value,
        };
      });
      // write the data to a file
      file.writeFile("data.json", JSON.stringify(data), (err) => {
        if (err) throw err;
        console.log("The file has been saved!");
      });
      return data;
    })
    .catch((err) => console.log(err));
}

app.get("/", (_, res) => {
  res.send(data);
});

app.get("/:code", (req, res) => {
  const { code } = req.params;
  const cached = myCache.get(code);
  if (cached) {
    res.send(cached);
  } else {
    const code_value = data[code];
    if (code_value) {
      myCache.set(code, code_value);
      res.send(code_value);
    } else {
      res.status(404).send("Not Found");
    }
  }
});

app.get("/*", (req, res) => {
  const key = req.url.split("/")[1];
  const length = req.url.split("/").length;
  console.log(length);
  const value = myCache.get(key);
  if (value) {
    res.send(value);
  } else {
    res.status(404).send("Not Found");
  }
});

app.listen(9000, (err) => {
  if (!err) console.log("server started at port 9000");
  if (data.length < 1) {
    console.log("Preparing data...");
    prepareData();
  } else {
    console.log("Using file data");
  }
});
