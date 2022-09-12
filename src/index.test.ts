import { hello } from ".";

describe("the test file runs", () => {
  it("the test is here", async () => {
    const response = await hello("event", "context", "callback");

    expect(response).toEqual({
      statusCode: 200,
      body: JSON.stringify({
        message:
          "Go Serverless v1.0! Your function executed successfully! WOOP WOOP",
        input: "event",
      }),
    });
  });
});
