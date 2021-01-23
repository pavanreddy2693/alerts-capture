var express = require('express');
var router = express.Router();
const Alert = require('../models/Alert');
const passport = require('passport');
var session = require('express-session');
const bcrypt = require('bcryptjs');
var ObjectId = require('mongodb').ObjectID;
var cookieParser = require('cookie-parser');
var flash = require('express-flash');


router.use(cookieParser('secret'));
router.use(session({
    cookie: { maxAge: 60000 },
    saveUninitialized: true,
    resave: 'true',
    secret: 'secret'
}));
router.use(flash());

const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');


router.get('/', forwardAuthenticated, (req, res) => res.render('index'));


router.get('/users/login', forwardAuthenticated, (req, res) => res.render('index'));

let errors = [];


router.get('/errors/all',ensureAuthenticated,function(req, res, next) {

  var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err){
    errors.push(err);
  }
  var dbo = db.db("alerts-capture");
  
  
  dbo.collection("alerts").find({}).sort({_id:-1}).limit(100).toArray(function(err, alerts) {
    if (err){
      errors.push(err);
    }
    console.log(alerts);
    res.render('all-errors',{alerts:alerts});
  });
  
});
  
});

/*alert edit*/
var editid;

router.get('/edit-alert',ensureAuthenticated,function(req, res, next) {
  console.log('testing nodemon');

editid=req.query.id;
console.log(editid);

  var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err){
    errors.push(err);
  }
  var dbo = db.db("alerts-capture");
  var ObjectId = require('mongodb').ObjectID;
  
  
  dbo.collection("alerts").find({"_id" : ObjectId(editid)}).toArray(function(err, alerts) {
    if (err){
      errors.push(err);
    }
    console.log(alerts);
    
    res.render('alert-edit',{alerts:alerts});
  });
  
});
  
});




/*update edited alert*/

router.post('/edit-alert',  function(req, res, next) {
  const { alertname, alerttype, dev_response, alertTriggeredOn,endpoint,responded_by } = req.body;
  let errors = [];
  
  console.log('in update loop'+ ' ' + editid);
  console.log(alertname+''+alerttype+''+alertTriggeredOn + ' '+ endpoint+''+responded_by+''+dev_response);
  if (!alertname || !alerttype || !alertTriggeredOn) {
    errors.push({ msg: 'Please enter all fields' });
  }
  if (errors.length > 0) {
    res.render('add', {
      alertname,
      alerttype,
      endpoint,
      responded_by,
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
      responded_by:responded_by,
      foendpoint: endpoint
    };
    var ObjectId = require('mongodb').ObjectID;
   
   
    dbo.collection("alerts").find({"_id" : ObjectId(editid)}).toArray(function(err, updatealerts) {
      if (err) throw err;
      console.log(updatealerts);
    });

    dbo.collection("alerts").updateOne({"_id": ObjectId(editid)}, {
      $set: { alertname:alertname, alertTriggeredOn:alertTriggeredOn,endpoint:endpoint,dev_response:dev_response,alerttype:alerttype,responded_by:responded_by}}, function(err,res) {
    if (err) throw err;
    console.log("1 document updated");
    console.log(res.result.nModified + " document(s) updated");
    
    
    });

    dbo.collection("alerts").find({}).sort({_id:-1}).limit(100).toArray(function(err, alerts) {
      if (err){
        errors.push(err);
      }
      console.log(alerts);
      res.render('all-errors',{alerts:alerts});
    });
  });
}
});


/* alert delete*/

router.get('/delete',  function(req, res, next) {
  const { alertname, alerttype, dev_response, alertTriggeredOn,endpoint,responded_by } = req.body;
  let errors = [];
  editid=req.query.id;
  console.log(editid);

  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/";
  
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    
    var dbo = db.db("alerts-capture");

  var ObjectId = require('mongodb').ObjectID;
  dbo.collection("alerts").deleteOne({"_id" : ObjectId(editid)},function(err){
    if (err) throw err;
    console.log('record removed');
    var session = require('express-session');
    dbo.collection("alerts").find({}).sort({_id:-1}).limit(100).toArray(function(err, alerts) {
      if (err){
        errors.push(err);
      }
      console.log(alerts);
      res.render('all-errors',{alerts:alerts});
    });
    
  });
      
      
     
  });
  }); 







/* 5xx API */
router.get('/errors/triggered',ensureAuthenticated,function(req, res, next) {

  var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("alerts-capture");
  
  dbo.collection("alerts").aggregate([ { $match :{alerttype: "5xx"}},
    { $group: { _id:{alertname:"$alertname",dev_response: "$dev_response",endpoint:"$endpoint"}, count: { $sum: 1 } } }]).sort({count:-1,_id:-1}).toArray(function(err, alerts) {
  
    if (err) throw err;
    console.log(alerts);
    
    res.render('api',{alerts:alerts});
    
  });
  
});
  
});




/* 5xx API filtered */
router.get('/api/filter',ensureAuthenticated,function(req, res, next) {
  

let datefrom=req.query.datefrom;
let dateto=req.query.dateto;
let name=req.query.alertname;

if(datefrom!=''&& dateto!='' && name!=''){

  var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("alerts-capture");
  
  
  dbo.collection("alerts").aggregate([ { $match :{ $and:[{alerttype: "5xx"},{alertTriggeredOn: {$lte : dateto}},{alertname: {$eq:name}}, {alertTriggeredOn: {$gte : datefrom}}]}},
    { $group: { _id:{alertname:"$alertname",dev_response: "$dev_response",endpoint:"$endpoint"}, count: { $sum: 1 } } }]).sort({count:-1,_id:-1}).toArray(function(err, alerts) {
  
    if (err) throw err;
    console.log(alerts);
    res.render('api',{alerts:alerts});
  });
  
});
}


else if(datefrom!=''&& dateto=='' && name==''){
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/";
  
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("alerts-capture");
    
    
    dbo.collection("alerts").aggregate([ { $match :{ $and:[{alerttype: "5xx"}, {alertTriggeredOn: {$gte : datefrom}}]}},{ $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" , endpoint:"$endpoint"}, count: { $sum: 1 } } }]).sort({count:-1,_id:-1}).toArray(function(err, alerts) {
      if (err) throw err;
      console.log(alerts);
      res.render('api',{alerts:alerts});
    });
    
  });

}



else if(datefrom!=''&& dateto!='' && name==''){
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/";
  
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("alerts-capture");
    
    
    dbo.collection("alerts").aggregate([ { $match :{ $and:[ {alerttype: "5xx"},{alertTriggeredOn: {$gte : datefrom}},{alertTriggeredOn: {$lte : dateto}}]}},{ $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" , endpoint:"$endpoint"}, count: { $sum: 1 } } }]).sort({count:-1,_id:-1}).toArray(function(err, alerts) {
      if (err) throw err;
      console.log(alerts);
      res.render('api',{alerts:alerts});
    });
    
  });

}




else if(datefrom!=''&& dateto=='' && name!=''){
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/";
  
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("alerts-capture");
    
    
    dbo.collection("alerts").aggregate([ { $match :{ $and:[{alerttype: "5xx"}, {alertTriggeredOn: {$gte : datefrom}},{alertname: {$eq:name}}]}},{ $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" , endpoint:"$endpoint"}, count: { $sum: 1 } } }]).sort({count:-1,_id:-1}).toArray(function(err, alerts) {
      if (err) throw err;
      console.log(alerts);
      res.render('api',{alerts:alerts});
    });
    
  });

}




else if(datefrom==''&& dateto!='' && name!=''){
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/";
  
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("alerts-capture");
    
    
    dbo.collection("alerts").aggregate([ { $match :{ $and:[{alertTriggeredOn: {$gte : dateto}},{alerttype: "5xx"},{alertname: {$eq:name}}]}},{ $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" , endpoint:"$endpoint"}, count: { $sum: 1 } } }]).sort({count:-1,_id:-1}).toArray(function(err, alerts) {
      if (err) throw err;
      console.log(alerts);
      res.render('api',{alerts:alerts});
    });
    
  });

}




else if(datefrom==''&& dateto=='' && name!=''){
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/";
  
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("alerts-capture");
    
    
    dbo.collection("alerts").aggregate([ { $match :{ $and:[{alerttype: "5xx"},{alertname: {$eq:name}}]}},{ $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" , endpoint:"$endpoint"}, count: { $sum: 1 } } }]).sort({count:-1,_id:-1}).toArray(function(err, alerts) {
      if (err) throw err;
      console.log(alerts);
      res.render('api',{alerts:alerts});
    });
    
  });

}






else if(datefrom==''&& dateto!='' && name==''){
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/";
  
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("alerts-capture");
    
    
    dbo.collection("alerts").aggregate([ { $match:{ $and:[{alerttype: "5xx"}, {alertTriggeredOn: {$lte : dateto}}]}},{ $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" , endpoint:"$endpoint"}, count: { $sum: 1 } } }]).sort({count:-1,_id:-1}).toArray(function(err, alerts) {
      if (err) throw err;
      console.log(alerts);
      res.render('api',{alerts:alerts});
    });
    
  });

}


else if(datefrom==''&& dateto=='' && name==''){
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb://localhost:27017/";
  
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("alerts-capture");
    
    
    dbo.collection("alerts").aggregate([{ $match:{alerttype: "5xx"}},{ $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" , endpoint:"$endpoint"}, count: { $sum: 1 } } }]).sort({count:-1,_id:-1}).toArray(function(err, alerts) {
      if (err) throw err;
      console.log(alerts);
      res.render('api',{alerts:alerts});
    });
    
  });

}




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

  dbo.collection("alerts").aggregate( [    { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype"}, count: { $sum: 1 } } } ] ).toArray(function(err, summaryalerts) {
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
  const { alertname, alerttype, dev_response, alertTriggeredOn,endpoint,responded_by } = req.body;
  let errors = [];

  if (!alertname || !alerttype || !dev_response || !alertTriggeredOn) {
    errors.push({ msg: 'Please enter all fields' });
  }
  if (errors.length > 0) {
    res.render('add', {
      alertname,
      alerttype,
      endpoint,
      responded_by,
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
      responded_by:responded_by,
      endpoint: endpoint
    };
    dbo.collection("alerts").insertOne(myobj, function(err,res) {
    if (err) throw err;
    console.log("1 document inserted");
    
    
    db.close();
    });

  });
  req.flash('success_msg', 'Alert added successfully');
  res.render('add');
}
});









router.get('/alerts/filter',ensureAuthenticated, function(req, res, next) {


  var query;

let type=req.query.type;
     let datefrom=req.query.datefrom;
     let dateto=req.query.dateto;
     let name=req.query.alertname;
     console.log(dateto);

     /*0000*/

  if(type!='' && datefrom!=''&& dateto!='' && name!=''){
    console.log('entered if statement');

    var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

   
     console.log('name' + name);
     console.log('datefrom'+ datefrom);
     console.log('dateto' + dateto);
     console.log('type'+ type);
   


   dbo.collection("alerts").aggregate( [  { $match : { $and: [ {alerttype: type},{alertname: {$eq:name}},{alertTriggeredOn: {$gte : datefrom}},{alertTriggeredOn: {$lte : dateto}} ]}},  { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" }, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}

/*1000*/
  
  else if(type=='' && datefrom!='' && dateto!='' && name!='')
{
  console.log('entered elseif');
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

     console.log('name' + name);
   console.log('datefrom'+ datefrom);
   console.log('dateto' + dateto);
   console.log('type'+ type);
   
   dbo.collection("alerts").aggregate( [  { $match : { $and: [{alertname: {$eq:name}},{alertTriggeredOn: {$gte : datefrom}},{alertTriggeredOn: {$lte : dateto}} ]}},  { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" }, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}

/*1000*/
else if(type=='' && datefrom!='' && dateto!='' && name!='')
{
  console.log('entered elseif');
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

     console.log('name' + name);
   console.log('datefrom'+ datefrom);
   console.log('dateto' + dateto);
   console.log('type'+ type);
   
   dbo.collection("alerts").aggregate( [  { $match : { $and: [{alertname: {$eq:name}},{alertTriggeredOn: {$gte : datefrom}},{alertTriggeredOn: {$lte : dateto}} ]}},  { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" }, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}
/*1010*/
else if(type=='' && datefrom!='' && dateto!='' && name=='')
{
  console.log('entered elseif');
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

     console.log('name' + name);
   console.log('datefrom'+ datefrom);
   console.log('dateto' + dateto);
   console.log('type'+ type);
   
   dbo.collection("alerts").aggregate( [  { $match : { $and: [{alertTriggeredOn: {$gte : datefrom}},{alertTriggeredOn: {$lte : dateto}} ]}},  { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" }, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}
/*1011*/

else if(type=='' && datefrom!='' && dateto=='' && name=='')
{
  console.log('entered elseif');
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

     console.log('name' + name);
   console.log('datefrom'+ datefrom);
   console.log('dateto' + dateto);
   console.log('type'+ type);
   
   dbo.collection("alerts").aggregate( [  { $match : { $and: [{alertTriggeredOn: {$gte : datefrom}} ]}},  { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" }, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}

/*1101*/

else if(type=='' && datefrom=='' && dateto!='' && name=='')
{
  console.log('entered elseif');
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

     console.log('name' + name);
     console.log('datefrom'+ datefrom);
     console.log('dateto' + dateto);
     console.log('type'+ type); 
  
   dbo.collection("alerts").aggregate( [  { $match : { $and: [{alertTriggeredOn: {$lte : dateto}}  ]}},  { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" }, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}
/*1111*/
else if(type=='' && datefrom=='' && dateto=='' && name=='')
{
  console.log('entered right');
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

     console.log('name' + name);
   console.log('datefrom'+ datefrom);
   console.log('dateto' + dateto);
   console.log('type'+ type);
   
   dbo.collection("alerts").aggregate( [ { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" }, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}
/*0011*/

else if(type!='' && datefrom!='' && dateto=='' && name=='')
{
  console.log('entered elseif');
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

     console.log('name' + name);
   console.log('datefrom'+ datefrom);
   console.log('dateto' + dateto);
   console.log('type'+ type);
   
   dbo.collection("alerts").aggregate( [ { $match : { $and: [ {alerttype: type},{alertTriggeredOn: {$gte : datefrom}} ]}},{ $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" }, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}


/*0100*/

else if(type!='' && datefrom=='' && dateto!='' && name!='')
{
  console.log('entered elseif');
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

     console.log('name' + name);
     console.log('datefrom'+ datefrom);
     console.log('dateto' + dateto);
     console.log('type'+ type);   

   dbo.collection("alerts").aggregate( [ { $match : { $and: [ {alerttype: type},{alertname: {$eq:name}},{alertTriggeredOn: {$lte : dateto}} ]}},  { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" }, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}

/*0101*/

else if(type!='' && datefrom=='' && dateto!='' && name=='')
{
  console.log('entered elseif');
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

     console.log('name' + name);
     console.log('datefrom'+ datefrom);
     console.log('dateto' + dateto);
     console.log('type'+ type); 
  
   dbo.collection("alerts").aggregate( [{ $match : { $and: [ {alerttype: type},{alertTriggeredOn: {$lte : dateto}} ]}},   { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" }, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}

/*0110*/

else if(type!='' && datefrom=='' && dateto=='' && name!='')
{
  console.log('entered elseif');
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

     console.log('name' + name);
     console.log('datefrom'+ datefrom);
     console.log('dateto' + dateto);
     console.log('type'+ type);  
 
   dbo.collection("alerts").aggregate( [ { $match : { $and: [ {alerttype: type},{alertname: {$eq:name}} ]}},  { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" }, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}


/*0111*/
else if(type!='' && datefrom=='' && dateto=='' && name=='')
{
  console.log('entered right');
  
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

   
   console.log('name' + name);
   console.log('datefrom'+ datefrom);
   console.log('dateto' + dateto);
   console.log('type'+ type);

   dbo.collection("alerts").aggregate( [ { $match : { alerttype: type} },  { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" }, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}


/*1001*/

else if(type=='' && datefrom!='' && dateto!='' && name=='')
{
  console.log('entered elseif');
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

     console.log('name' + name);
     console.log('datefrom'+ datefrom);
     console.log('dateto' + dateto);
     console.log('type'+ type);


   dbo.collection("alerts").aggregate( [ { $match : { $and: [ {alertTriggeredOn: {$gte : datefrom}},{alertTriggeredOn: {$lte : dateto}} ]}},  { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype",dev_response: "$dev_response" }, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}


/*1100*/

else if(type=='' && datefrom=='' && dateto!='' && name!='')
{
  console.log('entered elseif');
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

     console.log('name' + name);
   console.log('datefrom'+ datefrom);
   console.log('dateto' + dateto);
   console.log('type'+ type);
   
   dbo.collection("alerts").aggregate( [{ $match : { $and: [ {alertname: {$eq:name}},{alertTriggeredOn: {$lte : dateto}} ]}},   { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype"}, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}


/*1110*/
else if(type=='' && datefrom=='' && dateto=='' && name!='')
{
  console.log('entered elseif');
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

     console.log('name' + name);
   console.log('datefrom'+ datefrom);
   console.log('dateto' + dateto);
   console.log('type'+ type);
   
   dbo.collection("alerts").aggregate( [ { $match : { $and: [ {alertname: {$eq:name}} ]}},  { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype"}, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}



/*0010*/
else if(type!='' && datefrom!='' && dateto=='' && name!='')
{
  console.log('entered elseif');
  var MongoClient = require('mongodb').MongoClient;
    var url = "mongodb://localhost:27017/";

    MongoClient.connect(url, function(err, db) {
     if (err) throw err;
     var dbo = db.db("alerts-capture");

     console.log('name' + name);
     console.log('datefrom'+ datefrom);
     console.log('dateto' + dateto);
     console.log('type'+ type);  
 
   dbo.collection("alerts").aggregate( [ { $match : { $and: [ {alerttype: type},{alertname: {$eq:name}},{alertTriggeredOn: {$gte : datefrom}} ]}},  { $group: { _id:{alertname:"$alertname", alerttype: "$alerttype"}, count: { $sum: 1 } } } ] ).toArray(function(err, sumalerts) {
    if (err) throw err;
    console.log(sumalerts);
    res.render('alerts-filter',{filterbydate:sumalerts});
    db.close();
    });
  });
}


});

module.exports = router;