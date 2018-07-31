const express = require('express');
const router = express.Router();
const helpers = require('../helpers');

module.exports = function(pool){

  /* GET login page. */
  router.get('/', function(req, res, next) {
    res.render('login');
  });

  router.post('/', function(req, res){
    let email = req.body.email;
    let password = req.body.password;
    sql = `SELECT COUNT(email) AS login FROM users WHERE email='${email}' AND password='${password}'`;
    pool.query(sql, [], (err, data)=>{
      if(err) throw err;
      if(data.rows[0].login > 0){
        req.session.email = email;
        res.redirect('/projects');
      }else{
        res.redirect('/');
      }
    });
  });

  router.get('/projects', helpers, function(req, res, next){
    getProject(function(data){
      res.render('projects', {data: data});
    });
  });

  router.get('/show', function(req, res, next){
    let id = req.query.id;
    let name = req.query.name;
    let members = req.query.members;
    console.log(id+" "+name+" "+members);
    res.redirect('/projects');
  });

  router.get('/profile', helpers, function(req, res, next){
    getProject(function(data){
      res.render('profile');
    });
  });

  router.get('/logout', function(req, res){
    req.session.destroy(function(err){
      res.redirect('/');
    });
  });

  function getProject(cb){
    let sql = "SELECT * FROM members, users, projects WHERE members.userid=users.userid AND members.projectid=projects.projectid";
    pool.query(sql, [], (err, data)=>{
      if(err) throw err;
      cb(data.rows);
    });
  }

  return router;
}
