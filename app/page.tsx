"use client";
// Import necessary modules
import React, { useCallback, useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useDropzone } from "react-dropzone";
import Slider from "react-slick";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Sample codon map data
const codonMap = [
  {
    name: "Alanine",
    abbreviation1: "A",
    abbreviation3: "Ala",
    dna: ["GCT", "GCC", "GCA", "GCG"],
    rna: ["GCU", "GCC", "GCA", "GCG"],
    about:
      "Alanine adalah asam amino yang penting dalam pembentukan protein dan kontribusi pada pembentukan jaringan otot. Fungsinya mencakup peran sebagai sumber energi tambahan untuk otot selama aktivitas fisik. Meskipun tubuh dapat memproduksinya sendiri, konsumsi makanan yang mengandung alanine tetap penting. Sumber alami alanine termasuk daging, telur, ikan, dan produk susu.",
  },
  {
    name: "Arginine",
    abbreviation1: "R",
    abbreviation3: "Arg",
    dna: ["CGT", "CGC", "CGA", "CGG", "AGA", "AGG"],
    rna: ["CGU", "CGC", "CGA", "CGG", "AGA", "AGG"],
    about:
      "Arginine adalah asam amino yang memiliki peran penting dalam mendukung fungsi pembuluh darah dan sistem kekebalan tubuh. Asam amino ini membantu melebarkan pembuluh darah, meningkatkan aliran darah, dan mendukung penyembuhan luka. Selain itu, arginine juga terlibat dalam produksi hormon pertumbuhan dan dapat ditemukan dalam makanan seperti daging, ikan, kacang-kacangan, dan produk susu. Konsumsi arginine melalui pola makan seimbang dapat mendukung kesehatan jantung dan sistem kekebalan tubuh.",
  },
  {
    name: "Asparagine",
    abbreviation1: "N",
    abbreviation3: "Asn",
    dna: ["AAT", "AAC"],
    rna: ["AAU", "AAC"],
    about:
      "Asparagine adalah asam amino yang berperan dalam transportasi nitrogen dalam tubuh. Asam amino ini membantu menghasilkan senyawa yang diperlukan untuk pertumbuhan sel dan fungsi sistem saraf. Kita dapat menemukan asparagine dalam berbagai jenis makanan seperti sayuran, kacang-kacangan, dan biji-bijian. Keberadaan asparagine penting untuk pemeliharaan keseimbangan nitrogen dalam tubuh, yang mendukung berbagai fungsi vital dalam pertumbuhan dan perkembangan.",
  },
  {
    name: "Aspartic Acid",
    abbreviation1: "D",
    abbreviation3: "Asp",
    dna: ["GAT", "GAC"],
    rna: ["GAU", "GAC"],
    about:
      "Aspartic Acid adalah asam amino yang berperan dalam pembentukan protein dan energi sel. Asam amino ini memainkan peran penting dalam menyediakan bahan bakar untuk sel-sel tubuh. Kita dapat menemukan Aspartic Acid dalam berbagai makanan seperti daging, ikan, sayuran, dan produk susu. Fungsinya melibatkan proses pembentukan ATP, yang merupakan sumber energi utama bagi sel. Aspartic Acid juga berkontribusi pada fungsi normal otak dan sistem saraf.",
  },
  {
    name: "Cysteine",
    abbreviation1: "C",
    abbreviation3: "Cys",
    dna: ["TGT", "TGC"],
    rna: ["UGU", "UGC"],
    about:
      "Cysteine adalah asam amino yang penting untuk membentuk protein dalam tubuh. Asam amino ini mengandung sulfur dan dapat ditemukan dalam berbagai makanan seperti daging, telur, bawang putih, dan produk susu. Fungsinya melibatkan pembentukan senyawa bernama glutathione, yang memiliki peran dalam detoksifikasi dan perlindungan sel dari kerusakan. Cysteine juga mendukung kesehatan kulit, rambut, dan kuku.",
  },
  {
    name: "Glutamine",
    abbreviation1: "Q",
    abbreviation3: "Gln",
    dna: ["CAA", "CAG"],
    rna: ["CAA", "CAG"],
    about:
      "Glutamine adalah asam amino yang mendukung fungsi normal sistem kekebalan tubuh dan pencernaan. Asam amino ini ditemukan dalam makanan seperti daging, ikan, produk susu, sayuran hijau, dan kacang-kacangan. Glutamine juga memiliki peran penting dalam menyediakan energi bagi sel-sel tubuh, khususnya sel-sel usus. Fungsinya melibatkan penyembuhan jaringan usus dan mendukung pertumbuhan sel-sel tubuh.",
  },
  {
    name: "Glutamic Acid",
    abbreviation1: "E",
    abbreviation3: "Glu",
    dna: ["GAA", "GAG"],
    rna: ["GAA", "GAG"],
    about:
      "Glutamic acid adalah asam amino yang berperan dalam pengaturan rasa umami pada makanan. Asam amino ini ditemukan dalam berbagai jenis makanan, seperti daging, ikan, keju, dan sayuran tertentu. Fungsinya penting dalam sistem saraf sebagai neurotransmitter dan dapat mendukung fungsi otak yang sehat. Glutamic acid juga terlibat dalam pembentukan protein serta memiliki peran dalam metabolisme energi tubuh.",
  },
  {
    name: "Glycine",
    abbreviation1: "G",
    abbreviation3: "Gly",
    dna: ["GGT", "GGC", "GGA", "GGG"],
    rna: ["GGU", "GGC", "GGA", "GGG"],
    about:
      "Glycine adalah asam amino yang termasuk dalam kelompok asam amino nonesensial. Asam amino ini memiliki struktur sederhana dan berperan dalam pembentukan protein serta zat lain dalam tubuh. Glycine juga berfungsi sebagai neurotransmitter yang dapat menenangkan sistem saraf, membantu tidur, dan mendukung kesehatan otak. Asam amino ini dapat ditemukan dalam berbagai makanan, termasuk daging, ikan, produk susu, dan sayuran.",
  },
  {
    name: "Histidine",
    abbreviation1: "H",
    abbreviation3: "His",
    dna: ["CAT", "CAC"],
    rna: ["CAU", "CAC"],
    about:
      "Histidine adalah asam amino esensial yang diperlukan oleh tubuh untuk pertumbuhan dan pemeliharaan jaringan. Asam amino ini berperan dalam sintesis protein, pembentukan enzim, dan dukungan sistem kekebalan tubuh. Histidine juga terlibat dalam proses metabolisme dan dapat ditemukan dalam makanan seperti daging, ikan, telur, susu, dan kacang-kacangan. Keberadaan histidine penting untuk fungsi normal tubuh manusia.",
  },
  {
    name: "Isoleucine",
    abbreviation1: "I",
    abbreviation3: "Ile",
    dna: ["ATT", "ATC", "ATA"],
    rna: ["AUU", "AUC", "AUA"],
    about:
      "Isoleucine adalah jenis asam amino yang esensial, artinya tubuh manusia tidak dapat memproduksinya sendiri dan perlu diperoleh dari makanan. Asam amino ini memiliki peran penting dalam pembentukan protein, pertumbuhan jaringan, dan penyediaan energi. Sumber makanan yang kaya isoleucine meliputi daging, ikan, telur, produk susu, dan beberapa jenis kacang-kacangan. Keberadaan isoleucine mendukung fungsi otot, sistem kekebalan tubuh, dan metabolisme tubuh secara umum.",
  },
  {
    name: "Leucine",
    abbreviation1: "L",
    abbreviation3: "Leu",
    dna: ["TTA", "TTG", "CTT", "CTC", "CTA", "CTG"],
    rna: ["UUA", "UUG", "CUU", "CUC", "CUA", "CUG"],
    about:
      "Leucine adalah asam amino penting yang diperlukan oleh tubuh untuk membangun protein. Asam amino ini membantu dalam pertumbuhan dan perbaikan jaringan otot, menjaga keseimbangan nitrogen dalam tubuh, dan memberikan energi saat dibutuhkan. Makanan kaya leucine meliputi daging, produk susu, kedelai, dan kacang-kacangan. Konsumsi leucine yang memadai dapat mendukung kebugaran otot, pemulihan setelah latihan, dan menjaga kesehatan sel tubuh secara keseluruhan.",
  },
  {
    name: "Lysine",
    abbreviation1: "K",
    abbreviation3: "Lys",
    dna: ["AAA", "AAG"],
    rna: ["AAA", "AAG"],
    about:
      "Lysine adalah asam amino esensial yang penting untuk pertumbuhan dan perbaikan jaringan tubuh. Fungsinya melibatkan pembentukan protein, produksi energi, dan mendukung kesehatan kulit. Tubuh tidak dapat menghasilkan lysine sendiri, sehingga perlu diperoleh melalui makanan atau suplemen. Sumber makanan yang kaya lysine termasuk daging, ikan, produk susu, dan kacang-kacangan. Menjaga asupan lysine yang cukup dapat mendukung sistem kekebalan tubuh, sintesis kolagen, dan keseimbangan nitrogen.",
  },
  {
    name: "Methionine",
    abbreviation1: "M",
    abbreviation3: "Met",
    dna: ["ATG"],
    rna: ["AUG"],
    about:
      "Methionine adalah asam amino esensial yang penting untuk sintesis protein dan pembentukan zat-zat penting dalam tubuh. Fungsinya melibatkan pembentukan protein, sintesis DNA, dan pembuatan senyawa seperti sistein dan taurin. Tubuh manusia tidak dapat menghasilkan methionine sendiri, sehingga perlu diperoleh dari makanan atau suplemen. Sumber makanan yang kaya methionine meliputi daging, ikan, telur, serta biji-bijian. Kehadirannya mendukung pertumbuhan sel, fungsi hati, dan menjaga keseimbangan nutrisi dalam tubuh.",
  },
  {
    name: "Phenylalanine",
    abbreviation1: "F",
    abbreviation3: "Phe",
    dna: ["TTT", "TTC"],
    rna: ["UUU", "UUC"],
    about:
      "Phenylalanine adalah asam amino esensial yang memiliki peran penting dalam pembentukan protein dan neurotransmitter. Asam amino ini ditemukan dalam banyak makanan, seperti daging, telur, dan produk susu. Tubuh manusia tidak dapat menghasilkan phenylalanine sendiri, sehingga perlu diperoleh melalui makanan atau suplemen. Phenylalanine berkontribusi pada pembentukan neurotransmitter seperti dopamine, norepinephrine, dan epinephrine, yang memengaruhi suasana hati dan fungsi sistem saraf. Meskipun penting, individu dengan kondisi khusus seperti fenilketonuria perlu memantau asupan phenylalanine mereka.",
  },
  {
    name: "Proline",
    abbreviation1: "P",
    abbreviation3: "Pro",
    dna: ["CCT", "CCC", "CCA", "CCG"],
    rna: ["CCU", "CCC", "CCA", "CCG"],
    about:
      "Proline adalah asam amino yang memainkan peran kunci dalam struktur protein. Asam amino ini memiliki sifat unik karena memiliki cincin rantai samping, yang membedakannya dari asam amino lainnya. Proline ditemukan dalam jumlah besar dalam kolagen, protein struktural yang mendukung kulit, tulang, dan jaringan ikat. Kontribusinya terhadap struktur protein membantu mempertahankan kekuatan dan elastisitas berbagai bagian tubuh. Proline juga terlibat dalam proses penyembuhan luka dan regenerasi jaringan. Sumber makanan yang kaya proline meliputi daging, ikan, produk susu, dan kacang-kacangan.",
  },
  {
    name: "Serine",
    abbreviation1: "S",
    abbreviation3: "Ser",
    dna: ["TCT", "TCC", "TCA", "TCG", "AGT", "AGC"],
    rna: ["UCU", "UCC", "UCA", "UCG", "AGU", "AGC"],
    about:
      "Serine adalah asam amino yang memiliki peran penting dalam pembentukan protein di dalam tubuh. Asam amino ini terlibat dalam proses pembentukan senyawa lain, seperti fosfolipid yang membentuk sel-sel tubuh. Serine juga berkontribusi pada pembentukan kolagen, protein struktural yang mendukung kulit dan jaringan ikat. Selain itu, serine menjadi kunci dalam pembentukan karnitin, suatu zat yang berperan dalam metabolisme lemak. Asam amino ini dapat ditemukan dalam berbagai makanan, termasuk daging, produk susu, telur, dan kacang-kacangan. Serine juga mendukung fungsi sistem saraf dan dapat berperan dalam menjaga keseimbangan mental.",
  },
  {
    name: "Threonine",
    abbreviation1: "T",
    abbreviation3: "Thr",
    dna: ["ACT", "ACC", "ACA", "ACG"],
    rna: ["ACU", "ACC", "ACA", "ACG"],
    about:
      "Threonine adalah asam amino yang esensial untuk tubuh manusia karena tidak dapat diproduksi secara alami. Asam amino ini berperan penting dalam pembentukan protein dan berkontribusi pada pertumbuhan serta fungsi normal jaringan tubuh. Threonine juga berpartisipasi dalam pembentukan kolagen, zat yang mendukung struktur kulit, tulang, dan pembuluh darah. Makanan seperti daging, produk susu, kacang-kacangan, dan biji-bijian merupakan sumber threonine yang baik. Keberadaan threonine dalam diet membantu menjaga kesehatan sistem saraf dan mendukung fungsi hati serta sistem kekebalan tubuh.",
  },
  {
    name: "Tryptophan",
    abbreviation1: "W",
    abbreviation3: "Trp",
    dna: ["TGG", "TGA"],
    rna: ["UGG", "UGA"],
    about:
      "Tryptophan adalah asam amino esensial yang berperan dalam pembentukan protein dan memiliki peran penting dalam produksi serotonin, neurotransmitter yang memengaruhi suasana hati dan tidur. Tryptophan dapat ditemukan dalam makanan seperti daging, telur, kacang-kacangan, dan produk susu. Konsumsi makanan yang kaya tryptophan dapat mendukung kesehatan mental dan membantu regulasi pola tidur. Meskipun diperlukan dalam jumlah kecil, tryptophan memiliki dampak positif pada keseimbangan emosi dan kualitas tidur.",
  },
  {
    name: "Tyrosine",
    abbreviation1: "Y",
    abbreviation3: "Tyr",
    dna: ["TAT", "TAC"],
    rna: ["UAU", "UAC"],
    about:
      "Tyrosine adalah asam amino yang memiliki peran penting dalam pembentukan protein dan berfungsi sebagai prekursor beberapa senyawa penting dalam tubuh. Asam amino ini dapat diubah menjadi neurotransmitter seperti dopamin, norepinefrin, dan epinefrin, yang berperan dalam regulasi suasana hati dan respon stres. Tyrosine ditemukan dalam makanan seperti daging, ikan, produk susu, dan kacang-kacangan. Konsumsi cukup tyrosine dapat mendukung fungsi kognitif, konsentrasi, dan respons tubuh terhadap tekanan. Meskipun diperlukan dalam jumlah kecil, tyrosine memiliki dampak positif pada kesehatan mental dan respons tubuh terhadap situasi tertentu.",
  },
  {
    name: "Valine",
    abbreviation1: "V",
    abbreviation3: "Val",
    dna: ["GTT", "GTC", "GTA", "GTG"],
    rna: ["GUU", "GUC", "GUA", "GUG"],
    about:
      "Valine adalah asam amino esensial yang berperan penting dalam pembentukan protein dan pertumbuhan otot. Asam amino ini membantu menjaga keseimbangan nitrogen dalam tubuh dan menyediakan sumber energi tambahan selama latihan fisik intensif. Valine dapat ditemukan dalam makanan seperti daging, produk susu, kacang-kacangan, dan biji-bijian. Kehadirannya membantu mendukung fungsi otot, mempercepat pemulihan setelah latihan, dan menjaga vitalitas tubuh. Dengan kontribusinya pada sintesis protein dan energi, valine menjadi komponen penting dalam memelihara kesehatan dan kinerja fisik secara keseluruhan.",
  },
];

// Interface for codon objects
interface Codon {
  name: string;
  abbreviation1: string;
  abbreviation3: string;
  dna: string[];
  rna: string[];
  about: string;
}

// Interface for the conversion result
interface ConversionResult {
  aminoAcidSequence: string;
  stopCodon: string | null;
}

// React functional component for the DNA/RNA sequence converter
const CodonConverter: React.FC = () => {
  const [dnaSequence, setDnaSequence] = useState("");
  const [result, setResult] = useState<JSX.Element | null>(null);

  const [aminoAcidCountResult, setAminoAcidCountResult] = useState<any | null>(
    null
  );
  const [isDNA, setIsDNA] = useState(true);
  const [isLazyLoading, setIsLazyLoading] = useState(false);

  const resetLazyLoading = () => {
    setIsLazyLoading(false);
  };

  // Event handler for file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      try {
        setIsLazyLoading(true); // Set lazy loading state to true
        const fileContent = await readFileContent(file);
        setDnaSequence(fileContent);

        // Reset lazy loading state after 3 seconds
        setTimeout(resetLazyLoading, 2000);
      } catch (error) {
        console.error("Error reading file:", error);
        setIsLazyLoading(false); // Reset lazy loading state in case of an error
      }
    }
  }, []);

  // UseDropzone hook configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // Function to preprocess DNA/RNA sequence (remove spaces and paragraphs)
  const preprocessNucleicAcidSequence = (sequence: string): string => {
    // Remove spaces and paragraphs
    return sequence.replace(/\s+/g, "");
  };

  // Function to convert DNA or RNA to single-letter amino acids
  const convertNucleicAcidToSingleLetterAminoAcids = (
    sequence: string,
    isDNA: boolean,
    codonMap: Codon[]
  ): ConversionResult => {
    let aminoAcidSequence = "";
    let stopCodonFound = false;
    let i;

    const stopCodons = isDNA
      ? ["TGA", "AGA", "AGG", "TAA", "TAG"]
      : ["UGA", "AGA", "AGG", "UAA", "UAG"];

    for (i = 0; i < sequence.length - 2; i += 3) {
      const codon = sequence.slice(i, i + 3);

      // Check if the stop codon is present
      if (stopCodons.includes(codon)) {
        // Marking that a stop codon is found
        stopCodonFound = true;
        break; // Stop the conversion process
      }

      const aminoAcid = codonMap.find((item) =>
        isDNA ? item.dna.includes(codon) : item.rna.includes(codon)
      );

      if (aminoAcid) {
        // Ensure aminoAcid is defined before accessing its properties
        aminoAcidSequence += aminoAcid.abbreviation1;
      }
    }

    const stopCodon = stopCodonFound ? sequence.slice(i, i + 3) : null;

    return {
      aminoAcidSequence,
      stopCodon,
    };
  };

  // Function to count occurrences of amino acids
  const countAminoAcidsOccurrences = (aminoAcidSequence: string) => {
    const aminoAcidCount: { [aminoAcid: string]: number } = {};

    for (let i = 0; i < aminoAcidSequence.length; i++) {
      const aminoAcid = aminoAcidSequence[i];
      aminoAcidCount[aminoAcid] = (aminoAcidCount[aminoAcid] || 0) + 1;
    }

    return aminoAcidCount;
  };

  // Event handler for file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      try {
        setIsLazyLoading(true); // Set lazy loading state to true
        const fileContent = await readFileContent(file);
        setDnaSequence(fileContent);
        setTimeout(resetLazyLoading, 2000);
      } catch (error) {
        console.error("Error reading file:", error);
      }
    }
  };

  // Function to check if the text contains only A, C, U, and G
  const isValidSequence = (text: string, isDNA: boolean): boolean => {
    const validChars = isDNA ? ["A", "C", "T", "G"] : ["A", "C", "U", "G"];
    const regex = new RegExp(`^[${validChars.join("")}]+$`, "i");
    return regex.test(text);
  };

  // Event handler for convert button click
  const handleConvertClick = () => {
    const preprocessedSequence = preprocessNucleicAcidSequence(dnaSequence);

    // Check if the sequence is valid
    if (!isValidSequence(preprocessedSequence, isDNA)) {
      setResult(
        <> Invalid sequence. Please provide a valid DNA or RNA sequence.</>
      );
      setAminoAcidCountResult(null);
      return;
    }

    const { aminoAcidSequence, stopCodon } =
      convertNucleicAcidToSingleLetterAminoAcids(
        preprocessedSequence,
        isDNA,
        codonMap
      );

    const countResult = countAminoAcidsOccurrences(aminoAcidSequence);

    // Modify the stopCodon output
    const stopCodonOutput =
      stopCodon &&
      stopCodon !== "TAA" &&
      stopCodon !== "TAG" &&
      stopCodon !== "UAA" &&
      stopCodon !== "UAG"
        ? ` ${stopCodon} - ${
            codonMap.find((item) =>
              isDNA
                ? item.dna.includes(stopCodon)
                : item.rna.includes(stopCodon)
            )?.name
          }(  ${
            codonMap.find((item) =>
              isDNA
                ? item.dna.includes(stopCodon)
                : item.rna.includes(stopCodon)
            )?.abbreviation3
          } / ${
            codonMap.find((item) =>
              isDNA
                ? item.dna.includes(stopCodon)
                : item.rna.includes(stopCodon)
            )?.abbreviation1
          } ) `
        : stopCodon;

    setResult(
      <div className="break-words">
        <p>Amino Acid Sequence:</p>
        <strong>{aminoAcidSequence}</strong>
        <br />
        <p className="mt-3"> Stop Codon:</p>
        <strong>{stopCodonOutput}</strong>
      </div>
    );
    setAminoAcidCountResult(countResult);
  };
  // useEffect to trigger automatic conversion when dnaSequence is updated
  useEffect(() => {
    handleConvertClick(); // Trigger the conversion
  }, [dnaSequence, isDNA]);

  // Function to get the "about" information based on the amino acid abbreviation
  const getAboutInformation = (abbreviation: string) => {
    const aminoAcid = codonMap.find(
      (item) => item.abbreviation1 === abbreviation
    );
    return aminoAcid?.about || "About information not available.";
  };
  const getAbbr3 = (abbreviation: string) => {
    const aminoAcid = codonMap.find(
      (item) => item.abbreviation1 === abbreviation
    );
    return aminoAcid?.abbreviation3 || "About information not available.";
  };
  const getSequenceName = (abbreviation: string) => {
    const aminoAcid = codonMap.find(
      (item) => item.abbreviation1 === abbreviation
    );
    return aminoAcid?.name || "About information not available.";
  };

  // Function to read file content
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file."));
        }
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsText(file);
    });
  };

  // Event handler for radio button change
  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsDNA(event.target.value === "dna");
  };

  // React component JSX
  return (
    <div className="bg-[#f5f5f5]">
      {isLazyLoading ? ( // Check lazy loading state
        <div className="flex items-center justify-center m-auto h-screen">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 24 24"
          >
            <path
              fill="none"
              stroke="currentColor"
              stroke-dasharray="15"
              stroke-dashoffset="15"
              stroke-linecap="round"
              stroke-width="2"
              d="M12 3C16.9706 3 21 7.02944 21 12"
            >
              <animate
                fill="freeze"
                attributeName="stroke-dashoffset"
                dur="0.3s"
                values="15;0"
              />
              <animateTransform
                attributeName="transform"
                dur="1.5s"
                repeatCount="indefinite"
                type="rotate"
                values="0 12 12;360 12 12"
              />
            </path>
          </svg>
          <p>Please wait.</p>
        </div>
      ) : aminoAcidCountResult ? (
        <>
          <div className="p-5  flex flex-col items-center justify-center">
            <button
            
              className="rounded-[20px] border-2 w-[40px] h-[40px] flex justify-center items-center hover:bg-[#b1a6da]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="25"
                height="25"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42a.996.996 0 0 0-1.41 0l-6.59 6.59a.996.996 0 0 0 0 1.41l6.59 6.59a.996.996 0 1 0 1.41-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1"
                />
              </svg>
            </button>
            <h1 className="font-bold text-[35px] text-center  ">RESULT</h1>
            {result && (
              <div className="text-center">
                <p>{result}</p>
              </div>
            )}
            <h2 className="mt-3">Amino Acid Count:</h2>
            <BarChart
              width={700}
              height={400}
              data={Object.entries(aminoAcidCountResult).map(
                ([aminoAcid, count]) => ({
                  aminoAcid: `${
                    codonMap.find((item) => item.abbreviation1 === aminoAcid)
                      ?.name || aminoAcid
                  } (${aminoAcid})`,
                  shortName: aminoAcid,
                  count,
                })
              )}
            >
              <XAxis dataKey="shortName" />
              <YAxis />
              <Tooltip
                content={({ payload }) => {
                  const aminoAcidInfo = payload?.[0]?.payload;

                  if (!aminoAcidInfo) {
                    return null;
                  }

                  const { aminoAcid, shortName, count } = aminoAcidInfo;
                  const aminoAcidData = codonMap.find(
                    (item) => item.abbreviation1 === shortName
                  );

                  if (!aminoAcidData) {
                    return null;
                  }

                  const fullAminoAcid = `${aminoAcidData.name} (${aminoAcidData.abbreviation3})`;

                  return (
                    <div className="custom-tooltip">
                      <p>{`${fullAminoAcid}`}</p>
                      <p>{`Count: ${count}`}</p>
                    </div>
                  );
                }}
                wrapperStyle={{
                  background: "white",
                  padding: "10px",
                  borderRadius: "10px",
                  borderColor: "black",
                  borderWidth: "1px",
                  borderStyle: "solid",
                }} // Tambahan style untuk background putih
              />

              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
            {/* Display about information for each amino acid */}
          </div>
          <div className="text-center w-[600px] mx-auto">
            <h2 className="mb-4">About Amino Acids:</h2>

            <Slider>
              {Object.keys(aminoAcidCountResult).map((aminoAcid) => (
                <div key={aminoAcid}>
                  <p>
                    <strong>
                      {getSequenceName(aminoAcid)} ({getAbbr3(aminoAcid)})
                    </strong>
                  </p>
                  <p>{getAboutInformation(aminoAcid)}</p>
                </div>
              ))}
            </Slider>
          </div>
        </>
      ) : (
        <div>
          <div
            {...getRootProps()}
            className={`bg-[#f2f3f4]  ${
              isDragActive ? "bg-gray-200" : ""
            } h-full w-full`}
            onClick={(e) => e.stopPropagation()} // Menghentikan propagasi klik agar tidak memicu DnD saat mengklik elemen ini
          >
            <div className="text-center h-screen flex flex-col justify-center items-center">
              <h1 className="font-bold text-[35px] text-center">
                DNA/RNA Sequence Converter
              </h1>
              <div className="flex flex-col">
                <label>Choose Sequence Type:</label>
                <label>
                  <input
                    type="radio"
                    value="dna"
                    checked={isDNA}
                    onChange={handleRadioChange}
                  />
                  DNA (A, C, T, dan G)
                </label>
                <label>
                  <input
                    type="radio"
                    value="rna"
                    checked={!isDNA}
                    onChange={handleRadioChange}
                  />
                  RNA (A, C, U, dan G)
                </label>
              </div>
              <br />
              <div>
                <input {...getInputProps()} />
                <label
                  htmlFor="fileInput"
                  className="inline-flex rounded-md text-white   bg-[#8884d8] h-[80px] w-[300px] font-semibold text-[25px] text-center justify-center items-center hover:bg-[#5b58a1] "
                >
                  Select TXT File
                </label>
                <input
                  id="fileInput"
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <p className="mt-5">
                  {isDragActive
                    ? "Drop the file here"
                    : "Or drop the file here"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodonConverter;
