const express = require('express');
const { redis } = require('../redis');

const router = express.Router();

router.get('/', async (req, res, next) => {
	const id = req.user.id;

	try {
		const head = await redis.lindex(`list:${id}`, 0);
		const character = await redis.hgetall(head);
		return res.json(character);
	} catch(e) {
		next(e);
	}
});

router.put('/', express.json(), async (req, res, next) => {
	const id = req.user.id;

	try {
		if (!('answeredCorrectly' in req.body)) {
			throw {
				message: '`answeredCorrectly` field is required',
				status: 400
			};
		}

		const { answeredCorrectly } = req.body;
		
		if (typeof answeredCorrectly !== 'boolean') {
			throw {
				message: '`answeredCorrectly` field must be boolean',
				status: 400
			};
		}

		const listKey = `list:${id}`;
		const list = await redis.lrange(listKey, 0, -1);
		const head = list[0];
		const oldScore = await redis.hget(`scores:${id}`, head);
		const newScore = answeredCorrectly ? oldScore * 2 : 1;
				
		const updatedList = [ ...list.slice(1, newScore + 1), head, ...list.slice(newScore + 1)];

		const pipeline = redis.multi();
		pipeline.del(listKey);
		pipeline.rpush(listKey, updatedList);
		pipeline.hset(`scores:${id}`, head, newScore);
		await pipeline.exec();

		// const scores = await redis.hgetall(`scores:${id}`);
		return res.sendStatus(204);
	} catch(e) {
		return next(e);
	}
});

module.exports = router;