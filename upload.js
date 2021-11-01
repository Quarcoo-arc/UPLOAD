const express = require("express");
const mongoose = require("mongoose");
const body_parser = require("body-parser");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const path = require("path");
const crypto = require("crypto");
const methodOverride = require("method-override");

const exp = express();
const bodyParser = body_parser;

exp.use(bodyParser.json());
exp.use(express.static("./front"));
exp.use(methodOverride("_method"));

const URI = "mongodb://localhost:27017/questionsdb";

const connection = mongoose.createConnection(URI);

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION, APP SHUTTING DOWN!");
  console.log(err.name, err.message);
  process.exit(1);
});

// Creating a Schema for uploaded files
const fileSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  name: {
    type: String,
    required: [true, "Uploaded file must have a name"],
  },
});

// Creating a Model from that Schema
const File = connection.model("File", fileSchema);

// let gfs;

connection.once("open", () => {
  // gfs = Grid(connection.db, mongoose.mongo);
  // gfs.collection("uploads");
  console.log("Database connected");
});

//Configuration for multer
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `files/admin-${file.fieldname}-${Date.now()}.${ext}`);
  },
});

//Array of acceptable file types
const fileTypes = ["pdf", "jpg", "jpeg", "png"];

// Multer Filter
const multerFilter = (req, file, cb) => {
  if (fileTypes.includes(file.mimetype.split("/")[1])) {
    cb(null, true);
  } else {
    cb(new Error("File Type Not Supported!!"), false);
  }
};

//Calling the "multer" Function
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

//API Endpoint for uploading file
exp.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const fileUploaded = req.file;
    console.log({ file: fileUploaded });
    if (!fileUploaded) {
      return res.send("File not Found!");
    } else {
      const newFile = await File.create(
        {
          name: req.file.filename,
        },
        (err, file) => {
          if (!err) console.log("File Successfully saved!");
          else console.log("Error saving file to database: ", err);
        }
      );
      return res.send("File uploaded successfully");
    }
  } catch (error) {
    console.log("Error: ", error);
    res.send("Error Adding File!");
  }
});

//Endpoint for viewing uploads on the frontend
exp.get("/files", async (req, res) => {
  try {
    const files = await File.find();
    res.status(200).json({
      status: "success",
      files,
    });
  } catch (error) {
    res.json({
      status: "Fail",
      error,
    });
  }
});

// get a specific file by name
exp.get("/files/:filename", async (req, res) => {
  try {
    const file = await File.findOne({ name: "files/" + req.params.filename });
    if (!file) {
      return res.status(404).json({
        err: "File Not Found",
      });
    } else {
      return res.json(file);
    }
  } catch (error) {
    console.log("Error: ", error);
  }
});


exp
  .get("/", (req, res) => {
    res.set({ "Allow-access-Allow-Origin": "*" });
    return res.redirect("upload.html");
  })
  .listen(3000);

console.log("Listening from port 3000");
