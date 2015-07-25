module.exports = {
  resolveUser : [{
    title: 'Credentials hash',
    type: 'object'
  }],
  fetchUser: [{
    title: 'Trusted hash',
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
