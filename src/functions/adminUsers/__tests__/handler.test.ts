import { handleCheckAdminUserExists } from "../handler";
import { faker } from "@faker-js/faker";
import {
  createParsedAPIGatewayProxyEvent,
  createAPIGatewayProxyEventContext,
} from "@libs/fixtures";
import schema from "../schema";
import { adminUserExists } from "@models/adminUsers";
import { mocked } from "jest-mock";
import { APIGatewayProxyResult } from "aws-lambda";

jest.mock("@models/adminUsers");
jest.mock("@middy/core", () => {
  return (handler: any) => {
    return {
      use: jest.fn().mockReturnValue(handler), // ...use(ssm()) will return handler function
    };
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("handleAdminUserExists", () => {
  const email = faker.internet.email();
  const context = createAPIGatewayProxyEventContext();
  const APIGatewayEvent = createParsedAPIGatewayProxyEvent<typeof schema>({
    body: {
      email,
    },
  });

  describe("when the user exists", () => {
    beforeEach(() => {
      mocked(adminUserExists).mockResolvedValueOnce(true);
    });

    it("returns statusCode 200", async () => {
      const { statusCode }: APIGatewayProxyResult =
        await handleCheckAdminUserExists(APIGatewayEvent, context, jest.fn());

      expect(statusCode).toEqual(200);
    });

    it("returns adminUserExists: true", async () => {
      const { body } = await handleCheckAdminUserExists(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(JSON.parse(body).adminUserExists).toEqual(true);
    });
  });

  describe("when the user does not exist", () => {
    beforeEach(() => {
      mocked(adminUserExists).mockResolvedValueOnce(false);
    });

    it("returns statusCode 404", async () => {
      const { statusCode }: APIGatewayProxyResult =
        await handleCheckAdminUserExists(APIGatewayEvent, context, jest.fn());

      expect(statusCode).toEqual(404);
    });

    it("returns adminUserExists: false", async () => {
      const { body } = await handleCheckAdminUserExists(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(JSON.parse(body).adminUserExists).toEqual(false);
    });
  });
});
