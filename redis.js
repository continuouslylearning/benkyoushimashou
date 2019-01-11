const Redis = require('ioredis');
const characters = require('./seed/characters');
const { REDIS_URL } = require('./config');
const bcrypt = require('bcryptjs');
const redis = new Redis(REDIS_URL);

async function seedDb() {

  const [ userId, hash ] = await Promise.all([
    redis.incr('users:id'), 
    bcrypt.hash('password', 10)
  ]);

  const pipeline = redis.multi();

  pipeline.hset('users:', 'demouser', userId);
  pipeline.hmset(`user:${userId}`, {
    id: userId, 
    username: 'demouser',
    password: hash
  });

  characters.forEach(({ romaji, system }) => {
    pipeline.rpush(`list:${userId}`,`${system}:${romaji}`);
    pipeline.hset(`scores:${userId}`, `${system}:${romaji}`, 1);
  });

  characters.forEach(({ system, character, romaji }) => {
    pipeline.hmset(`${system}:${romaji}`, {
      character,
      system,
      romaji
    });
  });
  
  return pipeline.exec();
}

if(require.main === module){
  seedDb();
}

module.exports = {
  redis
};

