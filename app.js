const express = require("express");
const mongoose = require("mongoose");
const Restaurant = require("./models/restaurant");
const app = express();
mongoose.connect("mongodb://localhost/restaurant-list", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const port = 3000;
const exphbs = require("express-handlebars");
const db = mongoose.connection;
const bodyParser = require("body-parser");
const methodOverride = require('method-override')

db.on("error", () => {
  console.log("mongodb error");
});
db.once("open", () => {
  console.log("mongodb connected!");
});

// 設定樣板引擎
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.use(express.static("public"));

app.get("/", (req, res) => {
  Restaurant.find() // 取出 Restaurant model 裡的所有資料
    .lean() // 把 Mongoose 的 Model 物件轉換成乾淨的 JavaScript 資料陣列
    .then((restaurants) => res.render("index", { restaurants })) // 將資料傳給 index 樣板
    .catch((error) => console.error(error)); // 錯誤處理
});

app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride('_method'))

app.get("/search", (req, res) => {
  //剔除多餘的空白
  const keyword = req.query.keyword.trim();
  //「搜尋資料為空」的例外處理
  const rightKeyword = keyword === "" ? "為空白" : keyword;
  Restaurant.find()
    .lean()
    .then((restaurants) => {
      const restaurantSearch  = restaurants.filter((restaurant) => {
        return (
          restaurant.name.toLowerCase().includes(rightKeyword.toLowerCase()) ||
          restaurant.category.toLowerCase().includes(rightKeyword.toLowerCase())
        );
      });
      restaurantSearch.length === 0
        ? res.render("notShow", { rightKeyword })
        : res.render("index", { restaurants: restaurantSearch, rightKeyword });
    })
    .catch((error) => console.error(error));
});

// 建立新的餐廳頁面
app.get("/restaurants/new", (req, res) => {
  return res.render("new");
});
// 建立新的餐廳到資料庫
app.post("/restaurants", (req, res) => {
  const datas = req.body; // 從 req.body 拿出表單裡的資料
  return Restaurant.create(datas) // 存入資料庫
    .then(() => res.redirect("/")) // 新增完成後導回首頁
    .catch((error) => console.log(error));
});

//瀏覽特定餐廳
app.get("/restaurants/:id", (req, res) => {
  const id = req.params.id;
  return Restaurant.findById(id)
    .lean()
    .then((restaurant) => res.render("detail", { restaurant }))
    .catch((error) => console.log(error));
});

//修改特定餐廳頁面
app.get("/restaurants/:id/edit", (req, res) => {
  const id = req.params.id;
  return Restaurant.findById(id)
    .lean()
    .then((restaurant) => res.render("edit", { restaurant }))
    .catch((error) => console.log(error));
});

//修改特定餐廳資料到資料庫
app.put("/restaurants/:id", (req, res) => {
  const id = req.params.id

  return Restaurant.findById(id)
    .then((restaurant) => {
      restaurant = Object.assign(restaurant, req.body)
      return restaurant.save();
    })

    .then(() => res.redirect(`/restaurants/${id}`))
    .catch((error) => console.log(error));
});

// 刪除特定餐廳
app.delete("/restaurants/:id", (req, res) => {
  const id = req.params.id;
  
  return Restaurant.findById(id)
    .then((restaurant) => restaurant.remove())
    .then(() => res.redirect("/"))
    .catch((error) => console.log(error));
});

app.listen(port, () => {
  console.log(`Express is listen on localhost:${port}`);
});
