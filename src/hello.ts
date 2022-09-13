import * as _ from "lodash";

// modern module syntax
export async function hello(name: string) {
  // dependencies work as expected
  console.log(_.VERSION);

  // async/await also works out of the box
  await new Promise((resolve, reject) => setTimeout(resolve, 500));

  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello, ${name}`,
    }),
  };

  return response;
}
