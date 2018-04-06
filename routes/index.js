var express = require('express');
var router = express.Router();
var distService = require('../services/dist.service');

/* GET home page. */
router.get('/', function(req, res, next) {
  
  res.render('pages/index', { title: 'Node API Server v1.0' });    
});

// about page 
router.get('/about', function(req, res) {
  res.render('pages/about');
});

module.exports = router;
