import { tree, revcomp, arrayExcise } from "./enzymeUtils";
import * as fs from "fs";
import * as path from "path";

interface Enzyme {
  name: string;
  sequence: string;
  cutPos: number;
}

export const parseEnzymeData = (data: string): Enzyme[] => {
  const enzymeList: Enzyme[] = [];
  const lines = data.split("\n");

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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(/\s+/);
    const name = parts[0];
    const sequenceInfo = parts[1];
    const cutPositions = parts[2] ? parts[2].match(/\((\d+)\/(\d+)\)/) : null;
    let cutPos1 = 0;
    let cutPos2 = 0;
    let sequence = "";

    if (cutPositions) {
      const [_, cut1, cut2] = cutPositions;
      cutPos1 = parseInt(cut1, 10);
      cutPos2 = parseInt(cut2, 10);
      sequence = sequenceInfo
        .replace("(", "")
        .replace(")", "")
        .replace("/", "");
    } else if (sequenceInfo.includes("^")) {
      const cutPositionMatch = sequenceInfo.match(/(\w+)\^(\w+)/);
      if (cutPositionMatch) {
        const [, beforeCut, afterCut] = cutPositionMatch;
        sequence = beforeCut + afterCut;
        cutPos1 = beforeCut.length;
      } else {
        sequence = sequenceInfo.replace("^", "");
      }
    } else {
      sequence = sequenceInfo;
    }

    const possibleSequences: string[] = [];
    const expandSequence = (seq: string, idx: number) => {
      if (idx === seq.length) {
        possibleSequences.push(seq);
        return;
      }

      const base = seq[idx];
      if (abbreviations[base]) {
        const bases = abbreviations[base].split("");
        bases.forEach((b) =>
          expandSequence(seq.slice(0, idx) + b + seq.slice(idx + 1), idx + 1)
        );
      } else {
        expandSequence(seq, idx + 1);
      }
    };

    expandSequence(sequence, 0);

    possibleSequences.forEach((seq) => {
      enzymeList.push({ name, sequence: seq, cutPos: cutPos1 });
      if (cutPos2) {
        enzymeList.push({ name, sequence: seq, cutPos: cutPos2 });
      }
    });
  }

  return enzymeList;
};

export const analyzeRestriction = (
  dnaSequence: string,
  enzymes: Enzyme[],
  transformInput?: string
) => {
  let transformedSequence: string | null = null;

  if (transformInput) {
    try {
      const transformedResult = transformSequence(transformInput);
      transformedSequence = transformedResult.originalTransformed1;
    } catch (error) {
      console.error("Error transforming input sequence:", error);
    }
  }

  const results = enzymes
    .map((enzyme) => {
      const { name, sequence, cutPos } = enzyme;
      let sitelist: string[] = [];
      tree(sequence, 0, sitelist);

      if (sitelist.length > 1) {
        for (let i = 1; i < sitelist.length; i++) {
          if (sitelist[i - 1] === revcomp(sitelist[i])) {
            sitelist = arrayExcise(i, 1, sitelist);
          }
        }
      }

      let cutPositions: number[] = [];
      const siteLength = sequence.length;
      sitelist.forEach((site) => {
        let pos = dnaSequence.indexOf(site);
        while (pos !== -1) {
          let cutPosInDna = pos + cutPos;
          if (!cutPositions.includes(cutPosInDna)) {
            cutPositions.push(cutPosInDna);
          }
          pos = dnaSequence.indexOf(site, pos + 1);
        }
      });

      const frequency = cutPositions.length;

      return {
        name,
        sequence,
        siteLength,
        overhang: 0,
        frequency,
        cutPositions,
      };
    })
    .filter((result) => result.frequency > 0);

  if (transformedSequence) {
    console.log("Transformed sequence:", transformedSequence);
  }

  return results;
};

function transformSequence(input: string) {
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

  const NStringInitial1 = "N".repeat(Math.abs(initialLength1));
  const NStringInitial2 = "N".repeat(Math.abs(initialLength2));
  const NString1 = "N".repeat(Math.abs(length1));
  const NString2 = "N".repeat(Math.abs(length2));

  const originalTransformed1 =
    (initialLength1 > 0
      ? "^" + NStringInitial1
      : initialLength1 < 0
      ? NStringInitial1 + "^"
      : "") +
    sequence +
    (length1 > 0 ? NString1 + "^" : length1 < 0 ? "^" + NString1 : "");

  const originalTransformed2 =
    (initialLength1 > 0
      ? "^" + NStringInitial2
      : initialLength1 < 0
      ? NStringInitial2 + "^"
      : "") +
    sequence +
    (length1 > 0 ? NString2 + "^" : length1 < 0 ? "^" + NString2 : "");

  return {
    originalTransformed1,
    originalTransformed2,
  };
}
