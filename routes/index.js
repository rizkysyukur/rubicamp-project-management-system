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
    let email = req.session.email;
    getProfile(email, function(data){
      res.render('profile', {email: email, data: data});
    });
  });

  router.post('/profile', helpers, function(req, res, next){
    let password = "";
    req.body.password ? password = `, password='${req.body.password}'` : password = "";
    let position = req.body.position;
    let type = req.body.type;
    let sql = `UPDATE users SET role='${position}', type='${type}' ${password} WHERE email='${req.session.email}'`;
    pool.query(sql, function(err){
      if(err) throw err;
      res.redirect('/profile');
    });
  });

  router.get('/add_project', helpers, function(req, res, next){
    getUser(function(user){
      res.render('add_project', {user: user});
    });
  });

  router.post('/add_project', helpers, function(req, res, next){
    let name = req.body.name;
    let members = req.body.members;
    let p_sql = `INSERT INTO projects(name) VALUES (${name})`;
    // pool.query(p_sql, function(err){
      // if(err) throw err;
      pool.query("SELECT projectid FROM projects ORDER BY projectid DESC LIMIT 1", [], (err, data)=>{
        if(err) throw err;
        let v_members = [];
        for (var i = 0; i < members.length; i++) {
          v_members.push(`(${members[i]}, ${data.rows[0].projectid})`);
        }
        let m_sql = `INSERT INTO members(userid, projectid) VALUES ${v_members.join(",")}`;

        console.log(p_sql);
        console.log(m_sql);
      });
    // });

    res.redirect("add_project");
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

  function getProfile(email, cb){
    let sql = `SELECT * FROM users WHERE email='${email}'`;
    pool.query(sql, [], (err, data)=>{
      if(err) throw err;
      cb(data.rows);
    });
  }

  function getUser(cb){
    let sql = `SELECT * FROM users`;
    pool.query(sql, [], (err, data)=>{
      if(err) throw err;
      cb(data.rows);
    });
  }

  return router;
}
