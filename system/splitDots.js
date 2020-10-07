const splitDots = (text = "") => {
  const splitArray = ["/../", "../"];
  for (let i = 0; i < splitArray.length; i++) {
    if (text.startsWith(splitArray[i])) {
      text = text.substr(splitArray[i].length, text.length);
      return splitDots(text);
    }
  }
  return text;
};
module.exports = splitDots;
