var express = require('express');
var config = require('../../config');
var router = express.Router();
var request = require('request');

router.get('/', function(req, res, next) {
  res.status(200).json({message:"This is a sample plugin"});
});
module.exports = router;
