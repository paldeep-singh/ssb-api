import {
  handleCheckAdminUserExists,
  handleCheckAdminUserPasswordIsSet,
} from "../handlers";
import { faker } from "@faker-js/faker";
import {
  createParsedAPIGatewayProxyEvent,
  createAPIGatewayProxyEventContext,
} from "@libs/fixtures";
import { adminUserEmailInput } from "../schema";
import { adminUserExists, adminUserPasswordIsSet, ErrorCodes } from "../model";
import { mocked } from "jest-mock";
import { APIGatewayProxyResult } from "aws-lambda";

jest.mock("../model");
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

const email = faker.internet.email();
const context = createAPIGatewayProxyEventContext();
const APIGatewayEvent = createParsedAPIGatewayProxyEvent<
  typeof adminUserEmailInput
>({
  body: {
    email,
  },
});

describe("handleAdminUserExists", () => {
  describe.each([
    ["exists", 200, true],
    ["does not exist", 404, false],
  ])("when the user %s", (_, expectedStatusCode, expectedAdminUserExists) => {
    beforeEach(() => {
      mocked(adminUserExists).mockResolvedValueOnce(expectedAdminUserExists);
    });

    it(`returns statusCode ${expectedStatusCode}`, async () => {
      const { statusCode }: APIGatewayProxyResult =
        await handleCheckAdminUserExists(APIGatewayEvent, context, jest.fn());

      expect(statusCode).toEqual(expectedStatusCode);
    });

    it(`returns adminUserExists: ${expectedAdminUserExists}`, async () => {
      const { body } = await handleCheckAdminUserExists(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(JSON.parse(body).adminUserExists).toEqual(expectedAdminUserExists);
    });
  });
});

describe("handleCheckAdminUserPasswordIsSet", () => {
  describe.each([
    ["set", 200, true],
    ["not set", 404, false],
  ])(
    "when the user's password is %s",
    (_, expectedStatusCode, expectedPasswordIsSet) => {
      beforeEach(() => {
        mocked(adminUserPasswordIsSet).mockResolvedValueOnce(
          expectedPasswordIsSet
        );
      });

      it(`returns statusCode ${expectedStatusCode}`, async () => {
        const { statusCode } = await handleCheckAdminUserPasswordIsSet(
          APIGatewayEvent,
          context,
          jest.fn()
        );

        expect(statusCode).toEqual(expectedStatusCode);
      });

      it(`"returns passwordIsSet ${expectedPasswordIsSet}"`, async () => {
        const { body } = await handleCheckAdminUserPasswordIsSet(
          APIGatewayEvent,
          context,
          jest.fn()
        );

        expect(JSON.parse(body).passwordIsSet).toEqual(expectedPasswordIsSet);
      });
    }
  );

  describe("when the user does not exist", () => {
    beforeEach(() => {
      mocked(adminUserPasswordIsSet).mockRejectedValueOnce(
        new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER)
      );
    });

    it("returns statusCode 404", async () => {
      const { statusCode } = await handleCheckAdminUserPasswordIsSet(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(statusCode).toEqual(404);
    });

    it(`returns ${ErrorCodes.NON_EXISTENT_ADMIN_USER} error message`, async () => {
      const { body } = await handleCheckAdminUserPasswordIsSet(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(JSON.parse(body).message).toEqual(
        ErrorCodes.NON_EXISTENT_ADMIN_USER
      );
    });
  });
});