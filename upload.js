const express = require('express');
const mongoose = require('mongoose');
const body_parser = require('body-parser');
const multer = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const path = require('path');
const crypto = require('crypto');
const methodOverride = require('method-override');

const exp = express();
const bodyParser = body_parser;

exp.use(bodyParser.json());
exp.use(express.static('front'));
exp.use(methodOverride('_method'));

const URI = 'mongodb://localhost:27017/questionsdb';

const connection = mongoose.createConnection(URI);

let gfs;

connection.once('open', () => {
  gfs = Grid(connection.db, mongoose.mongo)
  gfs.collection('uploads');
  console.log('Database connected');
})

const storage = new GridFsStorage({
  url: URI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
        console.log('File added successfully');
      });
    }); 
  }
});

const upload = multer({storage});

exp.post('/upload', upload.single('file'), (req, res) => {
 console.log({file: req.file});
});

// exp.get('/files', (req, res) => {
//   gfs.files.find().toArray((err, files) => {
//     if(!files || files.length === 0) {
//       return res.status(404).json({
//         err: 'File(s) Not Found'
//       });
//     }
//     return res.json(files);
//   });
// })

// //get a specific file by name
// exp.get('/files/:filename', (req, res) => {
//   gfs.files.findOne({filename: req.params.filename}), (err, file) => {
//     if(!file) {
//       return res.status(404).json({
//         err: 'File Not Found'
//       });
//     }
//     return res.json(file);
//   };
// })

exp.get('/', (req, res) => {
    res.set({ "Allow-access-Allow-Origin": "*" });
    return res.redirect('upload.html');
  })
  .listen(3000);

console.log('Listening from port 3000');