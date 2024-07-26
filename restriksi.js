// Data enzim dengan sekuens degenerate
const enzymes = [
  {
    nama: "AatII",
    sequence5: "GACGT/C",
    sequence3: "C/TGCAG",
    overhang: "three_prime",
  },
  {
    nama: "Acc65I",
    sequence5: "G/GTACC",
    sequence3: "CCCATG/G",
    overhang: "five_prime",
  },
  {
    nama: "AflIII",
    sequence5: "A/CRYGT",
    sequence3: "TGYRC/A",
    overhang: "five_prime",
  },
  {
    nama: "BglII",
    sequence5: "A/GATCT",
    sequence3: "TCTAG/A",
    overhang: "five_prime",
  },
  {
    nama: "BmgBI",
    sequence5: "CAC/GTC",
    sequence3: "GTG/CAG",
    overhang: "blunt",
  },
];

// DNA yang akan dianalisis
const dna =
  "CTGCAGGACGTCATCCTATTTCAACATCTATTCTGATTTTTTGGTCACCACGTCCCGGAAGTCTACATCCTAATTCTACCAGGATTTGGTATGATTTCACACGTTATAGCTCACTACTCAGGAAAGCGAGAACCCTTTGGATATTTGGGTATGGTTTATGCAATGATTGCTATAGGAATACTAGGATTTTTAGTATGAGCTCATCATATGTTTACAGTAGGAATGGACGTAGACACACGAGCATACTTCACCGCTGCAACAATGATAATTGCCGTACCAACAGGAATTAAGGTTTTTAGATGAATGGCAACACTCCAAGGATCAAATCTACAGTGAGAAACCCCACTACTATGAGCCCTGGGATTTGTTTTTCTATTTACGTTAGGAGGACTAACTGGGATTGTTCTAGCTAATTCCTCAATTGACGTTGTACTACACGACACTTACTACGTGGTAGCTCACTTCCATTATGTACTATCAATGGGAGCCGTCTTTGCAATTTTTGCAGGATTTACCCACTGGTTTCCTCTATTTTCAGGTTACAACCTACACCCTCTATGAGGAAAGGTGCACTTCTTTATTATGTTTATTGGAGTCAATCTAACATTCTTCCCACAACACT";
// CRYGT = C AC GT/C GC GT/ C GC GT/ C GT GT

// Fungsi untuk mengubah sekuens degenerate menjadi pola regex
function toRegexPattern(sequence) {
  const replacements = {
    A: "A",
    C: "C",
    G: "G",
    T: "T",
    R: "[AG]", // A or G
    Y: "[CT]", // C or T
    M: "[AC]", // A or C
    K: "[GT]", // G or T
    S: "[GC]", // G or C
    W: "[AT]", // A or T
    H: "[ACT]", // A or C or T
    B: "[CGT]", // C or G or T
    D: "[AGT]", // A or G or T
    N: "[ACGT]", // any base
  };

  return sequence.replace(
    /A|C|G|T|[RYMKSWHDN]/g,
    (match) => replacements[match] || match
  );
}

// Fungsi untuk menganalisis DNA dengan mempertimbangkan sekuens degenerate
function analyzeRestriction(dna, enzymes) {
  const result = [];

  for (const enzyme of enzymes) {
    // Konversi pola degenerate menjadi regex
    const pattern5 = toRegexPattern(enzyme.sequence5.replace("/", ""));
    const pattern3 = toRegexPattern(enzyme.sequence3.replace("/", ""));

    // Temukan posisi potong dan frekuensi untuk kedua pola
    const matches5 = Array.from(dna.matchAll(new RegExp(pattern5, "g")));
    const matches3 = Array.from(dna.matchAll(new RegExp(pattern3, "g")));

    matches5.forEach((match) => {
      const cutPosition = match.index + enzyme.sequence5.indexOf("/");
      result.push({
        Enzim: enzyme.nama,
        "Sequence Cut (5' & 3')": `${enzyme.sequence5}`,
        Overhang: enzyme.overhang,
        Position: cutPosition,
        Frequency: matches5.length,
      });
    });

    matches3.forEach((match) => {
      const cutPosition = match.index + enzyme.sequence3.indexOf("/");
      result.push({
        Enzim: enzyme.nama,
        "Sequence Cut (5' & 3')": `${enzyme.sequence3}`,
        Overhang: enzyme.overhang,
        Position: cutPosition,
        Frequency: matches3.length,
      });
    });
  }

  // Tampilkan hasil dalam format tabel
  console.log(
    "No | Enzim | Sequence Cut (5' & 3') | Overhang | Position | Frequency |"
  );
  console.log(
    "--- | ----- | --------------------- | -------- | --------- | ---------- |"
  );
  for (let i = 0; i < result.length; i++) {
    console.log(
      `${i + 1} | ${result[i].Enzim} | ${
        result[i]["Sequence Cut (5' & 3')"]
      } | ${result[i].Overhang} | ${result[i].Position} | ${
        result[i].Frequency
      } |`
    );
  }
}

// Panggil fungsi analisis
analyzeRestriction(dna, enzymes);
