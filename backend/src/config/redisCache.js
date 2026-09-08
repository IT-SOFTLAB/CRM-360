const { redisClient } = require("./redis");

/**
 * Get data from Redis cache
 */
const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
};

/**
 * Store data in Redis cache
 * @param {string} key
 * @param {any} data
 * @param {number} ttl - Time to live in seconds
 */
const setCache = async (key, data, ttl = 300) => {
  try {
    await redisClient.set(key, JSON.stringify(data), {
      EX: ttl,
    });

    return true;
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete one cache key
 */
const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Redis DELETE error for key ${key}:`, error);
    return false;
  }
};

/**
 * Delete multiple cache keys
 */
const deleteCaches = async (keys) => {
  try {
    if (keys.length > 0) {
      await redisClient.del(keys);
    }

    return true;
  } catch (error) {
    console.error("Redis DELETE MULTIPLE error:", error);
    return false;
  }
};

const deletePatternCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await redisClient.del(keys);
      console.log(`Cleared ${keys.length} cache key(s) for pattern: ${pattern}`);
    }
    return true;
  } catch (error) {
    console.error(`Redis Pattern DELETE error for pattern ${pattern}:`, error);
    return false;
  }
};
module.exports = {
  getCache,
  setCache,
  deleteCache,
  deleteCaches,
  deletePatternCache, // Exported helper
};