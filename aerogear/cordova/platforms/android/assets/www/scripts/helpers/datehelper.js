//borrowing from stackoverflow  http://stackoverflow.com/a/9282695/1807970

(function() {
  //ISO-8601 Date Matching
  var reIsoDate = /^(\d{4})-(\d{2})-(\d{2})((T)(\d{2}):(\d{2})(:(\d{2})(\.\d*)?)?)?(Z)?$/;
  Date.parseISO = function(val) {
    var m;

    m = typeof val === 'string' && val.match(reIsoDate);
    if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[6] || 0, +m[7] || 0, +m[9] || 0, parseInt((+m[10]) * 1000) || 0));

    return new Date(null);
  }

  //MS-Ajax Date Matching
  var reMsAjaxDate = /^\\?\/Date\((\-?\d+)\)\\?\/$/;
  Date.parseAjax = function(val) {
    var m;

    m = typeof val === 'string' && val.match(reMsAjaxDate);
    if (m) return new Date(+m[1]);

    return null;
  }
})();