export const id = (() => {
  let nextId = 1;
  return () => {
    nextId += 1;
    return nextId;
  };
})();
