"use client";
// Import necessary modules
import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useDropzone } from "react-dropzone";
import Slider from "react-slick";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { db } from "./lib/firebase/init";
import { collection, getDocs } from "firebase/firestore";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Sample codon map data

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

const settings = {
  infinite: true,
  speed: 2000,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 5000,
  arrows: false,
};

// React functional component for the DNA/RNA sequence converter
const CodonConverter: React.FC = () => {
  const [dnaSequence, setDnaSequence] = useState("");
  const [result, setResult] = useState<JSX.Element | null>(null);

  const [aminoAcidCountResult, setAminoAcidCountResult] = useState<any | null>(
    null
  );
  const [isDNA, setIsDNA] = useState(true);
  const [isResultView, setIsResultView] = useState(false);
  const [codonMap, setCodonMap] = useState<Codon[]>([]);

  const fetchCodonMapFromFirestore = async () => {
    const querySnapshot = await getDocs(collection(db, "aminoAcid"));
    try {
      const codons: Codon[] = [];

      querySnapshot.forEach((doc) => {
        const codonData = doc.data();

        if (!codonData) {
          toast.error(`Invalid data for document ${doc.id}`);
          return;
        }

        codons.push({
          name: codonData?.nama,
          abbreviation1: codonData?.abbr1,
          abbreviation3: codonData?.abbr3,
          dna: codonData?.dna,
          rna: codonData?.rna,
          about: codonData?.abt,
        });
      });
      setCodonMap(codons);
    } catch (error) {
      // Display an error toast
      toast.error("Error fetching data from Firestore");
    }
  };

  // useEffect to fetch data from Firestore when the component mounts
  useEffect(() => {
    fetchCodonMapFromFirestore();
  }, []);

  // State for lazy loading
  const [isLazyLoading, setIsLazyLoading] = useState(false);
  // File input ref to clear the input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Function to handle back button click
  const handleBackButtonClick = () => {
    // Clear the DNA sequence and result
    setDnaSequence("");
    setResult(null);
    setAminoAcidCountResult(null);
    setIsResultView(false);

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
        // Display an error toast
        toast.error(`Error reading file: ${String(error)}`);

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
    if (codonMap.length === 0) {
      // Codon map is empty, return an appropriate result
      return {
        aminoAcidSequence: "Codon map is not available.",
        stopCodon: null,
      };
    }

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
        // Display an error toast
        toast.error(`Error reading file: ${String(error)}`);
        console.log(`Error reading file: ${String(error)}`);
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
    setIsLazyLoading(true); // Set lazy loading state to true
    if (!isValidSequence(preprocessedSequence, isDNA)) {
      // toast.error(
      //   " Invalid sequence. Please provide a valid DNA or RNA sequence."
      // );
      setResult(null);
      setAminoAcidCountResult(null);
      console.log(
        " Invalid sequence. Please provide a valid DNA or RNA sequence."
      );
      return;
    }
    setIsResultView(true); // Switch to result view

    // Reset lazy loading state after 3 seconds (adjust the time as needed)
    setTimeout(resetLazyLoading, 3000);

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
      <div>
        <p className="font-bold text-[30px]">Amino Acid Sequence:</p>
        <p className=" break-words">{aminoAcidSequence}</p>
        <p className="font-bold text-[30px] mt-4">Stop Codon:</p>
        <p>{stopCodonOutput}</p>
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
      {isResultView ? (
        <div className="p-5">
          {isLazyLoading ? (
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
          ) : (
            <>
              <div className="px-5  ">
                <button
                  className="rounded-[20px] border-2 w-[40px] h-[40px] flex justify-center items-center hover:bg-[#b1a6da]"
                  onClick={handleBackButtonClick}
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
              </div>
              <div className="lg:flex">
                <div className="border-2 p-5 rounded-xl lg:w-1/2 lg:mx-5">
                  <h2 className="font-semibold text-[30px]">Overview</h2>
                  <ResponsiveContainer height={400}>
                    <BarChart
                      data={Object.entries(aminoAcidCountResult).map(
                        ([aminoAcid, count]) => ({
                          aminoAcid: `${
                            codonMap.find(
                              (item) => item.abbreviation1 === aminoAcid
                            )?.name || aminoAcid
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
                        }}
                      />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="max-lg:mt-5 lg:w-1/2 rounded-xl">
                  {result && (
                    <div className="text-justify p-5 border-2 rounded-xl">
                      {result}
                    </div>
                  )}
                  <div className="mt-5 p-5 border-2 rounded-xl">
                    {" "}
                    <h2 className=" font-bold text-[30px]">
                      About Amino Acids:
                    </h2>
                    <Slider {...settings}>
                      {Object.keys(aminoAcidCountResult).map((aminoAcid) => (
                        <div key={aminoAcid} className="px-1">
                          <p>
                            <strong>
                              {getSequenceName(aminoAcid)} (
                              {getAbbr3(aminoAcid)})
                            </strong>
                          </p>
                          <p className="text-justify">
                            {getAboutInformation(aminoAcid)}
                          </p>
                        </div>
                      ))}
                    </Slider>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`bg-[#f2f3f4]  ${
            isDragActive ? "bg-gray-200" : ""
          } h-full w-full`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-justify h-screen flex flex-col justify-center items-center">
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
              <p className="mt-5 text-center">
                {isDragActive ? "Drop the file here" : "Or drop the file here"}
              </p>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default CodonConverter;
