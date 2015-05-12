var ResetPassword = (function() {
  var getParams = function() {
    return {
      old_password: $('#old_password').val().trim(),
      new_password: $('#new_password').val().trim(),
      repeat_password: $('#repeat_password').val().trim()
    }
  }
  var valid = function() {
    var params = getParams();
    var flag = true;
    if(params.old_password === '' || params.new_password === '' ||
      params.new_password !== params.repeat_password) {
      flag = false;
    }
    return flag;
  }

  return {
    valid: valid
  }
}).call(this);