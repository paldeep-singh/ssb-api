const { faker } = require("@faker-js/faker");

process.env.STAGE = "local";
process.env.UPSTASH_REDIS_REST_URL = faker.internet.url();
process.env.UPSTASH_REDIS_REST_TOKEN = faker.datatype.uuid();
