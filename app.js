//jshint esversion:6


const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs"); //Setting EJS as the view engine to dynamically change the content of the site.

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb+srv://admin-sudhanshu:Test123@cluster0.apallrb.mongodb.net/todoListDB");

// mongoose.connect("mongodb://localhost:27017/todoListDB", { useNewUrlParser: true });

const itemsSchema = new mongoose.Schema({
  name: { type: String }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todoList!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultLists = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  Item.find({})
    .then(function (foundItems) {

      if (foundItems.length === 0) {
        Item.insertMany(defaultLists)
          .then(() => {
            console.log("Succesfully inserted the entries!");
          })
          .catch(function (err) {
            console.log(err);
          })
        res.redirect("/");
      }

      else {
        res.render('list', { listTitle: "Today", newListItems: foundItems });
      }

    })
    .catch(function (err) {
      console.log(err);
    })

});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultLists
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing List
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(function (err) {
      console.log(err);
    })


})

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      })
  }

});

app.post("/delete", function (req, res) {

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(function (result) {
        console.log("Succesfully deleted the checked item");
        res.redirect("/");
      })
      .catch(function (err) {
        console.log(err);
      })
  } else {
    List.findOneAndUpdate({ name: listName },
      { $pull: { items: { _id: checkedItemId } } })
      .then(function (foundList) {
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      })
  }
})


app.get("/about", function (req, res) {
  res.render("about");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log("Server started on port successfully.");
});
