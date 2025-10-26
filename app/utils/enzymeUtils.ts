// utils/enzymeUtils.ts

export const revcomp = (strand: string): string => {
  return strand
    .split("")
    .reverse()
    .map((base) => {
      switch (base) {
        case "A":
          return "T";
        case "T":
          return "A";
        case "C":
          return "G";
        case "G":
          return "C";
        default:
          return base;
      }
    })
    .join("");
};

export const arrayExcise = <T>(
  start: number,
  length: number,
  array: T[]
): T[] => {
  return [...array.slice(0, start), ...array.slice(start + length)];
};

// const MAX_DEPTH = 10;

export const tree = (
  site: string,
  i: number,
  sitelist: string[],
  depth = 0
) => {
  // if (depth > MAX_DEPTH) return;

  const abbreviations: { [key: string]: string } = {
    R: "AG",
    Y: "CT",
    M: "AC",
    K: "GT",
    S: "GC",
    W: "AT",
    B: "CGT",
    D: "AGT",
    H: "ACT",
    V: "ACG",
    N: "ACGT",
  };

  let piece = site.slice(0, i);
  while (i < site.length) {
    const base = site[i];
    if (!["A", "C", "G", "T"].includes(base)) {
      if (abbreviations[base]) {
        const bases = abbreviations[base].split("");
        bases.forEach((b) => {
          const fragment = piece + b + site.slice(i + 1);
          tree(fragment, piece.length, sitelist, depth + 1);
        });
      } else {
        console.error(`Invalid base character '${base}' in site '${site}'`);
      }
      break;
    } else {
      piece += base;
    }
    i++;
  }

  if (piece.length === site.length) {
    sitelist.push(piece);
  }
};
