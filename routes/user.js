const express = require('express');
const { redis } = require('../redis');
const bcrypt = require('bcryptjs');
const characters = require('../seed/characters');

const router = express.Router();
router.use(express.json());

router.post('/', async (req, res, next) => {
  const { username, password } = req.body;
  const requiredFields = ['username', 'password'];

  const missingField = requiredFields.find(field => ! (field in req.body));

  if(missingField) {
    const err = new Error(`Missing ${missingField} field`);
    err.status = 400;
    return next(err);
  }

  const fieldSizes = {
    username: {
      min: 5
    },
    password: {
      min: 6,
      max: 72
    }
  };

  const tooSmallField = Object.keys(fieldSizes).find(
    field => 'min' in fieldSizes[field] && req.body[field].trim().length < fieldSizes[field].min
  );
  const tooLargeField = Object.keys(fieldSizes).find(
    field => 'max' in fieldSizes[field] && req.body[field].trim().length > fieldSizes[field].max
  );

  if(tooSmallField || tooLargeField){
    const message = tooSmallField 
      ? `${tooSmallField} must be at least ${fieldSizes[tooSmallField].min} characters long`
      : `${tooLargeField} must be at most ${fieldSizes[tooLargeField].max} characters long`;
    const err = new Error(message);
    err.status = 400;
    return next(err);
  }

  try {
    const existingPassword = await redis.hget( 'users:', username.toLowerCase());

    if(existingPassword){
      throw {
        message: 'Username already exists',
        status: 400
      };
    }

    const [ hash, id ] = await Promise.all([bcrypt.hash(password, 10), redis.incr('users:id')]);
    const listKey = `list:${id}`;
    const hashKey = `scores:${id}`;
    const pipeline = redis.multi();

    pipeline.hset('users:', username.toLowerCase(), id);

    pipeline.hmset(`user:${id}`, {
      id,
      username,
      password: hash
    });

    characters.forEach(({ romaji, system }) => {
      pipeline.rpush(listKey,`${system}:${romaji}`);
      pipeline.hset(hashKey, `${system}:${romaji}`, 1);
    });

    await pipeline.exec();
    
    return res.status(201).json({ username, id });
  } catch(e){
    next(e);
  }
});

module.exports = router;