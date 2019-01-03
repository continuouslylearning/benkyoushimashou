const { redis } = require('../redis');
const bcrypt = require('bcryptjs');

module.exports = async function localAuth(req, res, next){
  const { username, password } = req.body;

  try {

    if(!username || !password){
      throw {
        message: 'Missing username or password',
        status: 401
      };
    }
  
    const id = await redis.hget('users:', username.toLowerCase());
    if(!id){
      throw {
        message: 'Username does not exist',
        status: 401
      };
    }

    const user = await redis.hgetall(`user:${id}`);

    const isValid = await bcrypt.compare(password, user.password);

    if(!isValid){
      throw {
        message: 'Password is incorrect',
        status: 401
      };
    }

    req.user = {
      username: user.username,
      id: user.id
    };

    return next();
  } catch(e){
    return next(e);
  }
};