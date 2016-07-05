module.exports = {
  resolveUser : [{
    title: 'Credentials hash',
    type: 'object'
  }],
  fetchUser: [{
    title: 'Trusted hash',
    type: 'object'
  }],
  updateUser: [{
    title: 'Trusted hash',
    type: 'object'
  },{
    title: 'Update datahash',
    type: 'object'
  },{
    title: 'Update options',
    type: 'object'
  }],
  registerUser : [{
    title: 'User initial hash',
    type: 'object'
  }],
  usernamesLike: [{
    title: 'Starting string',
    type: 'string'
  }],
  usernameExists: [{
    title: 'Username',
    type: 'string'
  }]
};
