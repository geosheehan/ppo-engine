export function lastIndexWhere<T>(items: T[], matches: (item: T) => boolean): number {
   let found = -1;
   let low = 0;
   let high = items.length - 1;
   while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      if (matches(items[middle])) {
         found = middle;
         low = middle + 1;
      } else {
         high = middle - 1;
      }
   }
   return found;
}
