const express = require('express');
const router = express.Router();
const helpers = require('../helpers');

module.exports = function(pool){

  /* GET login page. */
  router.get('/', function(req, res, next) {
    res.render('login');
  });

  // cek login
  router.post('/', function(req, res){
    getDB(`SELECT COUNT(email) AS login FROM users WHERE email='${req.body.email}' AND password='${req.body.password}'`, function(data){
      if(data[0].login > 0){
        // menyimpan email yg diinputkan dari form login ke session
        req.session.email = req.body.email;
        res.redirect('/projects');
      }else{
        res.redirect('/');
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
            res.render('projects', {data: data, colum: colum, cpage: cpage, page: page, users: users});
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
    let members = req.query.members || 0;
    let ck_members = req.query.ck_members || 0;
    console.log(members);
    console.log(ck_members);
    // let condition = [];
    // if(id != 0 && ck_id != 0)condition.push(`projects.projectid=${id}`);
    // if(name != 0 && ck_name != 0)condition.push(`name='${name}'`);
    // console.log(condition);
    // if(condition.length > 0){
    //   getDB(`SELECT projects.projectid AS id, name, array_to_string(array_agg(distinct firstname),', ') AS member FROM members, users, projects WHERE members.userid=users.userid AND members.projectid=projects.projectid AND ${condition.join(" AND ")} GROUP BY name, projects.projectid`, function(data){ // get data projects
    //     getDB(`SELECT * FROM colum WHERE email = '${req.session.email}'`, function(colum){ // control which colum will be show
    //       res.render('projects', {data: data, colum: colum, cpage: 0, page: 0});
    //     });
    //   });
    // }else{
      res.redirect('/projects');
    // }
  });

  router.get('/profile', helpers, function(req, res, next){
    let email = req.session.email;
    getProfile(email, function(data){
      res.render('profile', {email: email, data: data});
    });
  });

  router.post('/profile', helpers, function(req, res, next){
    let position = req.body.position;
    let type = req.body.type;
    let password = "";
    req.body.password ? password = `, password='${req.body.password}'` : password = "";
    // update data di database
    executeDB(`UPDATE users SET role='${position}', type='${type}' ${password} WHERE email='${req.session.email}'`, function(){
      res.redirect('/profile');
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
  function showFormAdd(alert, res){
    getDB(`SELECT * FROM users`, function(user){
      res.render('add_project', {user: user, alert: alert});
    });
  }

  router.get('/add_project', helpers, function(req, res, next){
    // parameter bernilai false agar alert tidak muncul
    showFormAdd(false, res);
  });

  router.post('/add_project', helpers, function(req, res, next){
    let name = req.body.name;
    let members = req.body.members;
    // cek apakah name dan members diisi ?
    if(!name || !members){
      // parameter bernilai true agar alert muncul
      showFormAdd(true, res);
    }else{
      // menyimpan data ke tabel projects
      executeDB(`INSERT INTO projects(name) VALUES ('${name}')`, function(){
        // get id projects yang baru disimpan
        getDB(`SELECT projectid FROM projects ORDER BY projectid DESC LIMIT 1`, function(data){
          let v_members = [];
          // membentuk query untuk menyimpan data member sesuai jumlah member yang ikut serta
          for (var i = 0; i < members.length; i++) {
            v_members.push(`(${members[i]}, ${data.rows[0].projectid})`);
          }
          // menyimpan beberapa record ke table members
          executeDB(`INSERT INTO members(userid, projectid) VALUES ${v_members.join(",")}`, function(){
            res.redirect("projects");
          });
        });
      });
    }
  });

  router.get('/edit/:id', function(req, res, next){
    getDB(`SELECT * FROM users`, function(user){
      getDB(`SELECT name FROM projects WHERE projectid = ${req.params.id}`, function(project){
        res.render('edit_project', {user: user, project: project, alert: false});
      });
    });
  });

  router.get('/delete/:id', function(req, res, next){
    let id = req.params.id;
    executeDB(`DELETE FROM members WHERE projectid = ${id}`, function(){
      executeDB(`DELETE FROM projects WHERE projectid = ${id}`, function(){
        res.redirect("../projects");
      });
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
