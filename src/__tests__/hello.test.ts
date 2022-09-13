import { hello } from "../hello";
import { faker } from "@faker-js/faker";

describe("hello", () => {
  it("It says hello", async () => {
    const name = faker.name.firstName();
    const response = await hello(name);

    expect(response).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message: `Hello, ${name}`,
      }),
    });
  });
});
