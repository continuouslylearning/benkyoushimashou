const Redis = require('ioredis');
const characters = require('./seed/characters');
const { REDIS_URL } = require('./config');
const redis = new Redis(REDIS_URL);

function initializeDb() {
  const pipeline = redis.multi();
  characters.forEach(({ system, character, romaji }) => {
    pipeline.hmset(`${system}:${romaji}`, {
      character,
      system,
      romaji
    });
  });
  
  return pipeline.exec();
}

module.exports = {
  initializeDb,
  redis
};
