module.exports = {
  cekMember: function(userid, members){
    return members.filter(function(m){
      return m.userid == userid;
    }).length > 0;
  }
}
