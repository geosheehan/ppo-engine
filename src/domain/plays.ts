export const playTypeLabel = (typeDescKey: string): string => {
   const words = typeDescKey.replaceAll('-', ' ');
   return words.charAt(0).toUpperCase() + words.slice(1);
};
