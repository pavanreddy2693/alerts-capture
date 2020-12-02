var express = require('express');
var router = express.Router();
const Alert = require('../models/Alert');

const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');


router.get('/', forwardAuthenticated, (req, res) => res.render('index'));


router.get('/users/login', forwardAuthenticated, (req, res) => res.render('index'));

let errors = [];





router.get('/errors/all',ensureAuthenticated,function(req, res, next) {

  var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("alerts-capture");
  
  
  dbo.collection("alerts").find({}).toArray(function(err, alerts) {
    if (err) throw err;
    console.log(alerts);
    res.render('all-errors',{alerts:alerts});
  });
  
});
  
});





router.get('/add', ensureAuthenticated, (req, res) =>
  res.render('add')
);

router.get('/errors/summary',ensureAuthenticated,function(req, res, next) {

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("alerts-capture");

  dbo.collection("alerts").aggregate( [    { $group: { _id: "$alertname", count: { $sum: 1 } } } ] ).toArray(function(err, summaryalerts) {
    if (err) throw err;

    dbo.collection("alerts").aggregate( [    { $group: { _id: "$endpoint", count: { $sum: 1 } } } ] ).toArray(function(err, apis) {
      if (err) throw err;

    console.log(summaryalerts);
    console.log(apis);
    res.render('summary',{summaryalerts:summaryalerts,apis:apis});
  });
});
});
});






router.get('/users/register', function(req, res, next) {
  res.render('register', { title: 'Alerts Capture: Add Alert' });
});


router.post('/add',  function(req, res, next) {
  const { alertname, alerttype, dev_response, alertTriggeredOn,endpoint } = req.body;
  let errors = [];

  if (!alertname || !alerttype || !dev_response || !alertTriggeredOn) {
    errors.push({ msg: 'Please enter all fields' });
  }
  if (errors.length > 0) {
    res.render('add', {
      alertname,
      alerttype,
      endpoint,
      alertTriggeredOn,
      dev_response
    });
  }
  else{
    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("alerts-capture");
    var myobj = { 
      alertname: alertname,
      alerttype: alerttype,
      alertTriggeredOn: alertTriggeredOn,
      dev_response: dev_response,
      endpoint: endpoint
    };
    dbo.collection("alerts").insertOne(myobj, function(err,res) {
    if (err) throw err;
    console.log("1 document inserted");
    db.close();
    });

  });
  res.render('add');
}
});



router.get('/alerts/filter', function(req, res, next) {


  var query;

let type=req.query.type;
     let datefrom=req.query.datefrom;
     let dateto=req.query.dateto;
     console.log(dateto);

  if(type!='' && datefrom!=''&& dateto!=''){
    console.log('entered if statement');

    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

   
   console.log(type+ ''+ datefrom+ '' + dateto);
   


   dbo.collection("alerts").aggregate( [  { $match : { $and: [ {alerttype: type}, 
   {alertTriggeredOn: {$gte : datefrom}},
   {alertTriggeredOn: {$lte : dateto}}
    ]}}, { $group: { _id: "$alertname", alerttype : { $first: '$alerttype' },myCount: { $sum: 1 } } }  ,{ $sort : { myCount : -1} } ] ).toArray(function(err, sumalerts) {


    if (err) throw err;

    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
   });
   
  });
  }

  
  else if(type=='type1' && datefrom!=''&& dateto==null)
{
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

     let type=req.query.type;
     let datefrom=req.query.datefrom;
     
   
   console.log(type+ ''+ datefrom+ '' + dateto);
   


   dbo.collection("alerts").aggregate( [  { $match : { $and: [ {alerttype: type}, 
   {alertTriggeredOn: {$gte : datefrom}}
    ]}}, { $group: { _id: "$alertname", alerttype : { $first: '$alerttype' },myCount: { $sum: 1 } } }  ,{ $sort : { myCount : -1} } ] ).toArray(function(err, sumalerts) {


    if (err) throw err;

    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
   });
   
  });

   
 
  
}
else if(type!='' && datefrom=='')
{
  query = { "alerttype":type,"alertTriggeredOn":datefrom};
}
else (type!='' && datefrom!='')
{
  query = { "alerttype":type,"alertTriggeredOn":datefrom};
}

});

module.exports = router;