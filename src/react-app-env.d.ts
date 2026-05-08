declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.css?module' {
  const classes: { [key: string]: string };
  export default classes;
}

