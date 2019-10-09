'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;

var db;

module.exports = function (app) {

  MongoClient.connect(MONGODB_CONNECTION_STRING, function (err, dbo) {
    if (err) {
      console.log('Error connecting db', err);
    } else {
      console.log('Database connected');
      db = dbo.db('Books');
    }
  });

  app.route('/api/books')
    .get(function (req, res) {

      var books = db.collection('Books').find({}).toArray(function (err, data) {
        var result = data.map(x => {
          return { _id: x._id, title: x.title, commentcount: x.comments ? x.comments.length : 0 }
        });
        res.json({ books: result });
      });
    })

    .post(function (req, res) {
      var title = req.body.title;
      var newBook = {};
      newBook.title = title;
      newBook.comments = [];

      db.collection('Books').insert(newBook, function (err, data) {
        if (err) throw err;
        res.json(data.ops[0]);
      });
    })

    .delete(function (req, res) {
      db.collection('Books').remove({}, function (err, result) {
        if (err) {
          res.json({ error: err });
        } else {
          res.json('complete delete successful');
        }
      });
    });

  app.route('/api/books/:id')
    .get(function (req, res) {
      var bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      db.collection('Books').find({ "_id": ObjectId(bookid) }).toArray(function (err, results) {
        if (results.length <= 0) {
          res.json('no books exists');
        } else {
          res.json(results);
        }
      });
    })

    .post(function (req, res) {
      var bookid = req.params.id;
      var comment = req.body.comment;

      db.collection('Books').update(
        { _id: ObjectId(bookid) },
        {
          $push: {
            "comments": {
              comment: comment
            }
          }
        }, function (err, data) {
          db.collection('Books').find({ "_id": ObjectId(bookid) }).toArray(function (err, results) {
            res.json({ book: results[0] });
          });
        });
    })

    .delete(function (req, res) {
      var bookid = req.params.id;

      db.collection('Books').remove({ '_id': ObjectId(bookid) }, function (err, result) {
        if (err) {
          res.json({ error: err });
        } else {
          if (result.result.n > 0) {
            res.json('delete successful');
          } else {
            res.json('no books deleted');
          }
        }
      });

    });

};
