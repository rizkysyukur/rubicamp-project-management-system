module.exports = {
  formatDate: function(dateString){
    let date = new Date(dateString);

    let year = date.getFullYear();
    let month = date.getMonth()+1;
    let day = date.getDate();

    if (day < 10) {
      day = '0' + day;
    }
    if (month < 10) {
      month = '0' + month;
    }
    // YYYY-MM-DD
    return `${year}/${month}/${day}`;
  }
}
