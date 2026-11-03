// An NHL API desc key in sentence case, e.g. 'some-new-penalty' -> 'Some new penalty'.
export const descKeyToLabel = (descKey: string): string => {
   const words = descKey.replaceAll('-', ' ');
   return words.charAt(0).toUpperCase() + words.slice(1);
};
