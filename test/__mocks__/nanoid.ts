export const urlAlphabet =
  "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";

export function nanoid(size = 21): string {
  let id = "";
  for (let i = 0; i < size; i++) {
    id += urlAlphabet[Math.floor(Math.random() * 64)];
  }
  return id;
}

export function customAlphabet(alphabet: string, defaultSize = 21) {
  return (size = defaultSize) => {
    let id = "";
    for (let i = 0; i < size; i++) {
      id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return id;
  };
}
