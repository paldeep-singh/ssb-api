export const STAGE = process.env.STAGE;
export const LOCAL_DYNAMODB_ENDPOINT =
  STAGE === "local" ? "http://localhost:8448" : "";

const environment = {
  STAGE,
  LOCAL_DYNAMODB_ENDPOINT,
};

export default environment;
