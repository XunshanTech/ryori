var RoleValue = module.exports = function(roleValueAry) {
  this._roleValues = 0;
  roleValueAry.forEach(function(val) {
    this._roleValues = this._roleValues | val;
  })
}

RoleValue.prototype.add = function(val) {
  this._roleValues = this._roleValues | val;
}

RoleValue.prototype.remove = function(val) {
  this._roleValues = this._roleValues & (~val);
}

RoleValue.prototype.check = function(val) {
  return (this._roleValues & val) != 0;
}