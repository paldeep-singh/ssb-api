import { faker } from "@faker-js/faker";
import { APIGatewayEvent } from "aws-lambda";
import { handleHello } from "..";

describe("handleHello", () => {
  describe("when a name is provided", () => {
    it("says hello", async () => {
      const name = faker.name.firstName();

      const response = await handleHello({
        body: name,
      } as APIGatewayEvent);

      expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({
          message: `Hello, ${name}`,
        }),
      });
    });
  });

  describe("when a name is not provided", () => {
    it("returns an error", async () => {
      const reponse = await handleHello({
        body: null,
      } as APIGatewayEvent);

      expect(reponse).toEqual({
        statusCode: 400,
        body: JSON.stringify({
          message: `Error! Name is required`,
        }),
      });
    });
  });
});
