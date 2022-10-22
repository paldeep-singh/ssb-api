const kebabize = (string: string): string =>
  string.replace(
    /[A-Z]+(?![a-z])|[A-Z]/g,
    ($, ofs) => (ofs ? '-' : '') + $.toLowerCase()
  );

const resolveFilePath = (filePath: string): string => {
  return filePath.split(process.cwd())[1].substring(1).replace(/\\/g, '/');
};

export const handlerPath = (context: string): string => {
  return `${resolveFilePath(context)}`;
};

export const handlerRoute = (context: string): string => {
  return kebabize(resolveFilePath(context).replace('src/functions/', ''));
};
