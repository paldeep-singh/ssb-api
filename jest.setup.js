const { faker } = require("@faker-js/faker");

process.env.STAGE = "test";
process.env.UPSTASH_REDIS_REST_URL = faker.internet.url();
process.env.UPSTASH_REDIS_REST_TOKEN = faker.datatype.uuid();
