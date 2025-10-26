const fs = require("fs");

// Helper functions
const revcomp = (strand) => {
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

const arrayExcise = (start, length, array) => {
  return [...array.slice(0, start), ...array.slice(start + length)];
};

const MAX_DEPTH = 10; // Example limit

const tree = (site, i, sitelist, depth = 0) => {
  if (depth > MAX_DEPTH) return; // Prevent deep recursion

  const abbreviations = {
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
          tree(fragment, piece.length, sitelist, depth + 1); // Increment depth
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

const parseEnzymeData = (data) => {
  const enzymeList = [];
  const lines = data.split("\n");

  const abbreviations = {
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
    let cutPos = 0;

    if (cutPositions) {
      const [_, cut1, cut2] = cutPositions;
      cutPos = parseInt(cut1, 10);
      sequence = sequenceInfo;
    } else if (sequenceInfo.includes("^")) {
      const cutPositionMatch = sequenceInfo.match(/(\w+)\^(\w+)/);
      if (cutPositionMatch) {
        const [, beforeCut, afterCut] = cutPositionMatch;
        sequence = beforeCut + afterCut;
        cutPos = beforeCut.length;
      } else {
        sequence = sequenceInfo.replace("^", "");
      }
    } else {
      sequence = sequenceInfo;
    }

    const possibleSequences = [];
    const expandSequence = (seq, idx) => {
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
      enzymeList.push({ name, sequence: seq, cutPos });
    });
  }

  return enzymeList;
};

const analyzeRestriction = (dnaSequence, enzymes) => {
  enzymes.forEach((enzyme) => {
    const { name, sequence, cutPos } = enzyme;
    let sitelist = [];
    tree(sequence, 0, sitelist);

    // Eliminate reverse complements
    if (sitelist.length > 1) {
      for (let i = 1; i < sitelist.length; i++) {
        if (sitelist[i - 1] === revcomp(sitelist[i])) {
          sitelist = arrayExcise(i, 1, sitelist);
        }
      }
    }

    // Track positions and calculate site length and frequency
    let cutPositions = [];
    let siteLength = sequence.length;
    let frequency = 0;

    // Check for recognition sites in the DNA sequence
    sitelist.forEach((site) => {
      let pos = dnaSequence.indexOf(site);
      while (pos !== -1) {
        // Determine the position of the cut symbol
        let cutPosInDna = pos + cutPos;
        if (!cutPositions.includes(cutPosInDna)) {
          cutPositions.push(cutPosInDna); // Track this position
        }
        pos = dnaSequence.indexOf(site, pos + 1);
      }
    });

    frequency = cutPositions.length; // Frequency is the count of cut positions

    // Print results only if there are cut positions
    if (frequency > 0) {
      console.log(`Name: ${name}`);
      console.log(`Sequence: ${sequence}`);
      console.log(`Site Length: ${siteLength}`);
      console.log(`Overhang: 0`); // Assuming no overhang; adjust as needed
      console.log(`Frequency: ${frequency}`);
      console.log(`Cut Positions: ${cutPositions.join(", ")}`);
      console.log();
    }
  });
};

// DNA sequence
const dnaSequence = `ATCCTATTTCAACATCTATTCTGATTTTTTGGTCACCCGGAAGTCTACATCCTAATTCTACCAGGATTTGGTATGATTTCACACGTTATAGCTCACTACTCAGGAAAGCGAGAACCCTTTGGATATTTGGGTATGGTTTATGCAATGATTGCTATAGGAATACTAGGATTTTTAGTATGAGCTCATCATATGTTTACAGTAGGAATGGACGTAGACACACGAGCATACTTCACCGCTGCAACAATGATAATTGCCGTACCAACAGGAATTAAGGTTTTTAGATGAATGGCAACACTCCAAGGATCAAATCTACAGTGAGAAACCCCACTACTATGAGCCCTGGGATTTGTTTTTCTATTTACGTTAGGAGGACTAACTGGGATTGTTCTAGCTAATTCCTCAATTGACGTTGTACTACACGACACTTACTACGTGGTAGCTCACTTCCATTATGTACTATCAATGGGAGCCGTCTTTGCAATTTTTGCAGGATTTACCCACTGGTTTCCTCTATTTTCAGGTTACAACCTACACCCTCTATGAGGAAAGGTGCACTTCTTTATTATGTTTATTGGAGTCAATCTAACATTCTTCCCACAACACT`;

// Read the enzyme data from the file and perform restriction analysis
fs.readFile("link_proto.xml", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  const enzymes = parseEnzymeData(data);
  analyzeRestriction(dnaSequence, enzymes);
});
