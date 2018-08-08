const express = require('express');
const router = express.Router();
const helpers = require('../helpers');
const util = require('../helpers/util');

module.exports = function(pool){

  /* GET login page. */
  router.get('/', function(req, res, next) {
    res.render('login', {alert: null});
  });

  // cek login
  router.post('/', function(req, res){
    getDB(`SELECT COUNT(email) AS login FROM users WHERE email='${req.body.email}' AND password='${req.body.password}'`, function(data){
      if(data[0].login > 0){
        // menyimpan email yg diinputkan dari form login ke session
        req.session.email = req.body.email;
        res.redirect('/projects');
      }else{
        res.render('login', {alert: "Password dan email salah!!"});
      }
    });
  });

  // get projects page
  router.get('/projects', helpers, function(req, res, next){
    var offset = req.query.o || 0;
    var cpage = req.query.c || 1;
    // get data tabel project
    getDB(`SELECT projects.projectid AS id, name, array_to_string(array_agg(distinct firstname),', ') AS member FROM members, users, projects WHERE members.userid=users.userid AND members.projectid=projects.projectid GROUP BY name, projects.projectid LIMIT 5 OFFSET ${offset}`, function(data){ // get data projects
      getDB(`SELECT * FROM users`, function(users){
        // get jumlah project
        getDB(`SELECT COUNT(projectid) as count FROM projects`, function(c){ // get data projects
          // get colum yang akan ditampilkan
          getDB(`SELECT * FROM colum WHERE email = '${req.session.email}'`, function(colum){ // control which colum will be show
            // get jumlah halaman
            var page = Math.ceil(c[0].count/5);
            res.render('projects', {
              data: data,
              colum: colum,
              cpage: cpage,
              page: page,
              users: users
            });
          });
        });
      });
    });
  });

  router.get('/search', function(req, res, next){
    let id = req.query.id || 0;
    let ck_id = req.query.ck_id || 0;
    let name = req.query.name || 0;
    let ck_name = req.query.ck_name || 0;
    let members = req.query.members;
    let ck_members = req.query.ck_members || 0;
    let having_m = "";
    let condition = [];
    if(id != 0 && ck_id != 0)condition.push(`projects.projectid=${id}`);
    if(name != 0 && ck_name != 0)condition.push(`name='${name}'`);
    if(members != "not select" && ck_members != 0) having_m = `HAVING array_to_string(array_agg(distinct firstname),', ') LIKE '%${members}%'`;
    if(condition.length > 0 || having_m != ""){
      condition.length > 0 ? condition = `AND ${condition.join(" AND ")}` : condition = "";
      getDB(`SELECT projects.projectid AS id, name, array_to_string(array_agg(distinct firstname),', ') AS member FROM members, users, projects WHERE members.userid=users.userid AND members.projectid=projects.projectid ${condition} GROUP BY name, projects.projectid ${having_m}`, function(data){ // get data projects
        getDB(`SELECT * FROM colum WHERE email = '${req.session.email}'`, function(colum){ // control which colum will be show
          getDB(`SELECT * FROM users`, function(users){
            res.render('projects', {
              data: data,
              colum: colum,
              cpage: 0,
              page: 0,
              users: users
            });
          });
        });
      });
    }else{
      res.redirect('/projects');
    }
  });

  router.get('/profile', helpers, function(req, res, next){
    let email = req.session.email;
    getDB(`SELECT * FROM users WHERE email='${email}'`, function(data){
      res.render('profile', {
        email: email,
        data: data
      });
    });
  });

  router.post('/profile', helpers, function(req, res, next){
    let position = req.body.position;
    let type = req.body.type;
    let password = "";
    req.body.password ? password = `, password='${req.body.password}'` : password = "";
    // update data di database
    executeDB(`UPDATE users SET role='${position}', type='${type}' ${password} WHERE email='${req.session.email}'`, function(){
      res.redirect('/projects');
    });
  });

  router.get('/colum', function(req, res, next){
    let w_query = [];
    req.query.id ? w_query.push("c_id = true") : w_query.push("c_id = false");
    req.query.name ? w_query.push("c_name = true") : w_query.push("c_name = false");
    req.query.members ? w_query.push("c_member = true") : w_query.push("c_member = false");
    // update data di database
    executeDB(`UPDATE colum SET ${w_query.join(", ")} WHERE email='${req.session.email}'`, function(){
      res.redirect('/projects');
    });
  });

  // fungsi untuk menampilkan halaman project dan checkbox sejumlah user yang tersimpan
  router.get('/add_project', helpers, function(req, res, next){
    getDB(`SELECT * FROM users`, function(user){
      res.render('add_project', {user: user, alert: false});
    });
  });

  router.post('/add_project', helpers, function(req, res, next){
    let name = req.body.name;
    let members = req.body.members;
    // cek apakah name dan members diisi ?
    if(!name || !members){
      // parameter bernilai true agar alert muncul
      getDB(`SELECT * FROM users`, function(user){
        res.render('add_project', {
          user: user,
          alert: true
        });
      });
    }else{
      // menyimpan data ke tabel projects
      executeDB(`INSERT INTO projects(name) VALUES ('${name}')`, function(){
        // get id projects yang baru disimpan
        getDB(`SELECT projectid FROM projects ORDER BY projectid DESC LIMIT 1`, function(data){
          let v_members = [];
          // membentuk query untuk menyimpan data member sesuai jumlah member yang ikut serta
          for (var i = 0; i < members.length; i++) {
            v_members.push(`(${members[i]}, ${data[0].projectid})`);
          }
          // menyimpan beberapa record ke table members
          executeDB(`INSERT INTO members(userid, projectid) VALUES ${v_members.join(",")}`, function(){
            res.redirect("projects");
          });
        });
      });
    }
  });

  router.get('/edit_project/:id', function(req, res, next){
    getDB(`SELECT * FROM users`, function(user){
      getDB(`SELECT name, members.userid, projects.projectid FROM projects, members, users WHERE projects.projectid = members.projectid AND users.userid = members.userid AND projects.projectid = ${req.params.id}`, function(project){
        res.render('edit_project', {
          user: user,
          project: project,
          alert: false,
          util: util
        });
      });
    });
  });

  router.post('/edit_project/:id', helpers, function(req, res, next){
    let name = req.body.name;
    let members = req.body.members;
    let id = req.params.id;
    // cek apakah name dan members diisi ?
    if(!name || !members){
      getDB(`SELECT * FROM users`, function(user){
        getDB(`SELECT name, members.userid, projects.projectid FROM projects, members, users WHERE projects.projectid = members.projectid AND users.userid = members.userid AND projects.projectid = ${id}`, function(project){
          res.render('edit_project', {
            user: user,
            project: project,
            alert: true,
            util: util
          });
        });
      });
    }else{
      executeDB(`UPDATE projects SET name='${name}' WHERE projectid=${id}`, function(){
        // mengosongkan terlebih dahulu data member
        executeDB(`DELETE FROM members WHERE projectid=${id}`, function(){
          let v_members = [];
          // membentuk query untuk menyimpan data member sesuai jumlah member yang ikut serta
          for (var i = 0; i < members.length; i++) {
            v_members.push(`(${members[i]}, ${id})`);
          }
          // menyimpan beberapa record ke table members
          executeDB(`INSERT INTO members(userid, projectid) VALUES ${v_members.join(",")}`, function(){
            res.redirect("../projects");
          });
        });
      });
    }
  });

  router.get('/delete/:id', function(req, res, next){
    let id = req.params.id;
    executeDB(`DELETE FROM members WHERE projectid = ${id}`, function(){
      executeDB(`DELETE FROM projects WHERE projectid = ${id}`, function(){
        res.redirect("../projects");
      });
    });
  });

  router.get('/projects_overview/:id', function(req, res, next) {
    let id = req.params.id;
    res.render('projects_overview', {id: id});
  });

  // get projects page
  router.get('/projects_members/:id', helpers, function(req, res, next){
    let offset = req.query.o || 0;
    let cpage = req.query.c || 1;
    let id = req.params.id;
    // get data tabel project
    getDB(`SELECT * FROM users, members WHERE users.userid = members.userid AND projectid = ${id} LIMIT 5 OFFSET ${offset}`, function(users){
      // get jumlah project
      getDB(`SELECT COUNT(users.userid) as count FROM users, members WHERE users.userid = members.userid AND projectid = ${id}`, function(c){ // get data projects
        // get colum yang akan ditampilkan
        getDB(`SELECT * FROM colum_member WHERE email = '${req.session.email}'`, function(colum){ // control which colum will be show
          // get jumlah halaman
          var page = Math.ceil(c[0].count/5);
          res.render('projects_members', {
            id: id,
            data: users,
            colum: colum,
            cpage: cpage,
            page: page,
          });
        });
      });
    });
  });

  router.get('/add_project_member/:id', function(req, res, next){
    let id = req.params.id;
    getDB(`SELECT * FROM users`, function(user){
      getDB(`SELECT name, members.userid, projects.projectid FROM projects, members, users WHERE projects.projectid = members.projectid AND users.userid = members.userid AND projects.projectid = ${id}`, function(project){
        res.render('add_project_member', {
          id: id,
          user: user,
          project: project,
          alert: false,
          util: util
        });
      });
    });
  });

  router.post('/add_project_member/:id', function(req, res, next){
    let members = req.body.members;
    let id = req.params.id;
    // cek apakah members diisi ?
    if(!members){
      getDB(`SELECT * FROM users`, function(user){
        getDB(`SELECT name, members.userid, projects.projectid FROM projects, members, users WHERE projects.projectid = members.projectid AND users.userid = members.userid AND projects.projectid = ${id}`, function(project){
          res.render('add_project_member', {
            id: id,
            user: user,
            project: project,
            alert: true,
            util: util
          });
        });
      });
    }else{
      // mengosongkan terlebih dahulu data member
      executeDB(`DELETE FROM members WHERE projectid=${id}`, function(){
        let v_members = [];
        // membentuk query untuk menyimpan data member sesuai jumlah member yang ikut serta
        for (var i = 0; i < members.length; i++) {
          v_members.push(`(${members[i]}, ${id})`);
        }
        // menyimpan beberapa record ke table members
        executeDB(`INSERT INTO members(userid, projectid) VALUES ${v_members.join(",")}`, function(){
          res.redirect(`../projects_members/${id}`);
        });
      });
    }
  });

  router.get('/search_members/:id', function(req, res, next){
    let id = req.params.id;
    let userid = req.query.userid || 0;
    let ck_userid = req.query.ck_userid || 0;
    let name = req.query.name || 0;
    let ck_name = req.query.ck_name || 0;
    let position = req.query.position;
    let ck_position = req.query.ck_position || 0;
    let condition = [];
    if(userid != 0 && ck_userid != 0)condition.push(`users.userid=${userid}`);
    if(name != 0 && ck_name != 0)condition.push(`firstname='${name}'`);
    if(position != "not select" && ck_position != 0) condition.push(`role='${position}'`);
    if(condition.length > 0){
      getDB(`SELECT * FROM users, members WHERE users.userid = members.userid AND projectid = ${id} AND ${condition.join(" AND ")}`, function(data){ // get data projects
        getDB(`SELECT * FROM colum WHERE email = '${req.session.email}'`, function(colum){ // control which colum will be show
          res.render('projects_members', {
            id: id,
            data: data,
            colum: colum,
            cpage: 0,
            page: 0,
          });
        });
      });
    }else{
      res.redirect(`/projects_members/${id}`);
    }
  });

  router.get('/delete_member/:id/:userid', function(req, res, next){
    let id = req.params.id;
    let userid = req.params.userid;
    executeDB(`DELETE FROM members WHERE projectid = ${id} AND userid = ${userid}`, function(){
      res.redirect(`../../projects_members/${id}`);
    });
  });

  router.get('/colum_member/:id', function(req, res, next){
    let id = req.params.id;
    let w_query = [];
    req.query.id ? w_query.push("c_id = true") : w_query.push("c_id = false");
    req.query.name ? w_query.push("c_name = true") : w_query.push("c_name = false");
    req.query.position ? w_query.push("c_position = true") : w_query.push("c_position = false");
    // update data di database
    executeDB(`UPDATE colum_member SET ${w_query.join(", ")} WHERE email='${req.session.email}'`, function(){
      res.redirect(`../projects_members/${id}`);
    });
  });

  router.get('/logout', function(req, res){
    req.session.destroy(function(err){
      res.redirect('/');
    });
  });

  function getDB(sql, cb){
    pool.query(sql, [], (err, data)=>{
      if(err) throw err;
      cb(data.rows);
    });
  }

  function executeDB(sql, cb){
    pool.query(sql, function(err){
      if(err) throw err;
      cb();
    });
  }

  return router;
}
