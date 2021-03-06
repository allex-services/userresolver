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
  updateUserUnsafe: [{
    title: 'User Name',
    type: 'string'
  },{
    title: 'Profile Hash',
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
  }],
  changePassword: [{
    title: 'Username',
    type: 'string'
  },{
    title: 'Old Password',
    type: 'string'
  },{
    title: 'New Password',
    type: 'string'
  }],
  forcePassword: [{
    title: 'Username',
    type: 'string'
  },{
    title: 'Forced Password',
    type: 'string'
  }]
};
