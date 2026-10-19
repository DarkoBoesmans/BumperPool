// Bun loads .txt files as plain text: the translation sheets.
declare module "*.txt" {
  const text: string;
  export default text;
}
