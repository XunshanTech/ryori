var Role = module.exports = function(roleValue) {
  this._roleValues = 0 || roleValue;
}

Role.prototype.add = function(roleIndex) {
  this._roleValues = this._roleValues | Math.pow(2, roleIndex);
  return this._roleValues;
}

Role.prototype.remove = function(roleIndex) {
  this._roleValues = this._roleValues & (~Math.pow(2, roleIndex));
  return this._roleValues;
}

Role.prototype.check = function(roleIndex) {
  return (this._roleValues & Math.pow(2, roleIndex)) != 0;
}