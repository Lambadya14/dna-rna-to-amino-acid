function transformSequence(input) {
  // Extract initial length, sequence and lengths from input
  const regex = /\(?(-?\d*)\/?(-?\d*)\)?([A-Z]+)\(?(-?\d*)\/?(-?\d*)\)?/;
  const match = input.match(regex);

  if (!match) {
    throw new Error(
      "Input format is incorrect. Expected format: (INITLENGTH1/INITLENGTH2)SEQUENCE(LENGTH1/LENGTH2) or similar"
    );
  }

  const initialLength1 = match[1] ? parseInt(match[1]) : 0;
  const initialLength2 = match[2] ? parseInt(match[2]) : 0;
  const sequence = match[3];
  const length1 = match[4] ? parseInt(match[4]) : 0;
  const length2 = match[5] ? parseInt(match[5]) : 0;

  // Generate N string of given lengths
  const NStringInitial1 = "N".repeat(Math.abs(initialLength1));
  const NStringInitial2 = "N".repeat(Math.abs(initialLength2));
  const NString1 = "N".repeat(Math.abs(length1));
  const NString2 = "N".repeat(Math.abs(length2));

  // Handle positive and negative values
  const originalTransformed1 =
    (initialLength1 > 0
      ? "^" + NStringInitial1
      : initialLength1 < 0
      ? NStringInitial1 + "^"
      : "") +
    sequence +
    (length1 > 0 ? NString1 + "^" : length1 < 0 ? "^" + NString1 : "");
  const originalTransformed2 =
    (initialLength2 > 0
      ? "^" + NStringInitial2
      : initialLength2 < 0
      ? NStringInitial2 + "^"
      : "") +
    sequence +
    (length2 > 0 ? NString2 + "^" : length2 < 0 ? "^" + NString2 : "");

  return {
    originalTransformed1,
    originalTransformed2,
  };
}

// Example usage:
const inputs = [
  "GTAC(1/1)",
  "GTAC(-1/1)",
  "GTAC(1/-1)",
  "GTAC(-1/-1)",
  "(1/1)GTAC",
  "(-1/1)GTAC",
  "(1/-1)GTAC",
  "(-1/-1)GTAC",
  "(1/1)GTAC(1/1)",
  "(-1/1)GTAC(5/1)",
  "(1/-1)GTAC(1/-1)",
  "(-1/-1)GTAC(-1/-1)",
  "ACTGGG(-5/-4)",
  "(-3/-5)ACTGGG(-5/-4)",
  "(-3/-5)ACTGGG",
  "(3/5)ACTGGG(5/4)",
  "(3/-5)ACTGGG",
  "ACTGGG(5/4)",
  "GTAC",
  "CC(12/16)",
];

inputs.forEach((input) => {
  const result = transformSequence(input);
  console.log(`Input: ${input}`);
  console.log(
    "Original transformed sequence (initialLength1 and length1):",
    result.originalTransformed1
  );
  console.log(
    "Original transformed sequence (initialLength2 and length2):",
    result.originalTransformed2
  );
  console.log("----");
});
