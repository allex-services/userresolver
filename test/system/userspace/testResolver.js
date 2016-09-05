
function go (taskobj) {
  if (!taskobj && taskobj.sink) {
    process.exit(0);
    return;
  }
  require('./runlib')(taskobj);
}


module.exports = {
  sinkname: 'PlainResolver',
  identity: {name: 'user', role: 'user'},
  task: {
    name: go
  }
};
