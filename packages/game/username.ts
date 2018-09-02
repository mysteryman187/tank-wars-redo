
var generateUsername = require('project-name-generator');

export const username =  window.localStorage['tank-wars.userId'] || generateUsername().dashed;

///window.localStorage['tank-wars.userId'] = userId;