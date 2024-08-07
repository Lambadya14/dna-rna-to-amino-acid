"use client";
// Import necessary modules
import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  ChangeEvent,
} from "react";
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
import { Slide, ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TableDetails from "./components/tables/TableDetails";
import Image from "next/image";
import EnzymeAnalysis from "./components/pages/EnzymeAnalysis";

// Interface for codon objects
interface Codon {
  name: string;
  abbreviation1: string;
  abbreviation3: string;
  dna: string[];
  rna: string[];
  about: string;
  directory: string;
  charge: string;
  polarity: string;
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
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [selectedContent, setSelectedContent] = useState("");
  const [dnaSequence, setDnaSequence] = useState("");
  const [result, setResult] = useState<JSX.Element | null>(null);
  const [showChooseOption, setShowChooseOption] = useState(true);
  const [aminoAcidCountResult, setAminoAcidCountResult] = useState<any | null>(
    null
  );
  const [isDNA, setIsDNA] = useState(true);
  const [isResultView, setIsResultView] = useState(false);
  const [codonMap, setCodonMap] = useState<Codon[]>([]);
  const [useSpecificStopCodon, setUseSpecificStopCodon] = useState(false);
  const [showSpecificButton, setShowSpecificButton] = useState(false);
  const [useTerminatorAsStopCodon, setUseTerminatorAsStopCodon] =
    useState(false);
  const [totalAminoAcids, setTotalAminoAcids] = useState<number>(0);
  const [totalAminoAcidTypes, setTotalAminoAcidTypes] = useState<number>(0);
  const [analyzeTab, setAnalyzeTab] = useState<string>("AminoAcid");

  // fungsi pengganti untuk mengatur nilai state ketika pengguna mengklik radio button
  const handleTerminatorRadioChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const useTerminator = event.target.value === "terminator";
    const useSpecificStopCodon = !useTerminator;
    setUseTerminatorAsStopCodon(useTerminator);
    setUseSpecificStopCodon(useSpecificStopCodon); // Update useSpecificStopCodon state
  };

  // Tambahkan UI untuk memilih stop codon
  useEffect(() => {
    if (
      selectedDatabase === "karyorelictNuclear" ||
      selectedDatabase === "condylostomaNuclear" ||
      selectedDatabase === "blastocrithidiaNuclear"
    ) {
      setShowSpecificButton(true);
      setUseSpecificStopCodon(true); // Set useSpecificStopCodon to true
    } else {
      setShowSpecificButton(false);
      setUseSpecificStopCodon(false); // Set useSpecificStopCodon to false
    }
  }, [selectedDatabase]);

  const fetchCodonMapFromFirestore = async () => {
    if (selectedDatabase) {
      const querySnapshot = await getDocs(
        collection(db, `${selectedDatabase}`)
      );
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
            directory: codonData?.directory,
            charge: codonData?.charge,
            polarity: codonData?.polarity,
          });
        });
        setCodonMap(codons);
      } catch (error) {
        // Display an error toast
        toast.error("Error fetching data from Firestore");
      }
    } else {
    }
  };

  // useEffect to fetch data from Firestore when the component mounts
  useEffect(() => {
    fetchCodonMapFromFirestore();
  }, [selectedDatabase]);

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
    window.location.reload();
  };

  const resetLazyLoading = () => {
    setIsLazyLoading(false);
  };

  // Event handler for file drop
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0 && selectedDatabase !== "") {
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
      } else {
        // Display a warning toast
        toast.warn("Mohon untuk memilih tipe kode DNA terlebih dahulu.");
      }
    },
    [selectedDatabase]
  );

  // UseDropzone hook configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // Function to preprocess DNA/RNA sequence (remove spaces and paragraphs)
  const preprocessNucleicAcidSequence = (sequence: string): string => {
    // Remove spaces and paragraphs
    return sequence.replace(/\s+/g, "");
  };

  const convertNucleicAcidToSingleLetterAminoAcids = (
    sequence: string,
    isDNA: boolean,
    codonMap: Codon[],
    useSpecificStopCodon: boolean
  ): ConversionResult => {
    if (codonMap.length === 0) {
      // Codon map is empty, return an appropriate result
      return {
        aminoAcidSequence: "Codon map is not available.",
        stopCodon: null,
      };
    }

    let aminoAcidSequence = "";
    let stopCodon: string | null = null;
    const stopCodons: string[] = [];

    // If "Specific Stop Codon" option is selected, then do not use terminator as stop codon
    if (!useSpecificStopCodon) {
      // Use terminator as stop codon
      for (const codonData of codonMap) {
        if (codonData.name.toLowerCase() === "terminator") {
          stopCodons.push(...(isDNA ? codonData.dna : codonData.rna));
        }
      }
    }

    for (let i = 0; i < sequence.length - 2; i += 3) {
      const codon = sequence.slice(i, i + 3);

      // Check if the stop codon is present, unless specific stop codon option is chosen
      if (!useSpecificStopCodon && stopCodons.includes(codon)) {
        stopCodon = codon;
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
    if (selectedDatabase === "") {
      // Display a warning toast
      toast.warn("Mohon untuk memilih tipe kode DNA terlebih dahulu.");
      return;
    }

    const preprocessedSequence = preprocessNucleicAcidSequence(dnaSequence);

    // Check if the sequence is valid
    setIsLazyLoading(true); // Set lazy loading state to true
    if (!isValidSequence(preprocessedSequence, isDNA)) {
      setResult(null);
      setAminoAcidCountResult(null);

      toast.warn("Mohon berikan urutan yang sesuai!");
      setIsLazyLoading(false); // Reset lazy loading state in case of an error
      return;
    }
    setIsResultView(true); // Switch to result view

    // Reset lazy loading state after 3 seconds (adjust the time as needed)
    setTimeout(resetLazyLoading, 3000);

    const { aminoAcidSequence } = convertNucleicAcidToSingleLetterAminoAcids(
      preprocessedSequence,
      isDNA,
      codonMap,
      useSpecificStopCodon
    );

    const countResult = countAminoAcidsOccurrences(aminoAcidSequence);
    setAminoAcidCountResult(countResult);

    // Hitung jumlah total asam amino
    let total = 0;
    for (const aminoAcid in countResult) {
      total += countResult[aminoAcid];
    }
    setTotalAminoAcids(total);
    const totalTypes = Object.keys(countResult).length;
    setTotalAminoAcidTypes(totalTypes);

    setResult(
      <div className="group">
        <p className="font-bold text-[30px] overflow-hidden line-clamp-3 group-hover:line-clamp-none text-justify">
          Urutan Asam Amino:
        </p>
        <p className=" break-words  mb-5">{aminoAcidSequence}</p>
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

    if (!aminoAcid) return "About information not available.";

    return (
      <>
        <div>
          {aminoAcid.directory && (
            <Image
              src={`${aminoAcid.directory}`} // Sesuaikan dengan protokol dan port yang sesuai
              alt={`${aminoAcid.name}`}
              width={400}
              height={400}
              className="object-cover float-left me-5"
            />
          )}
          <strong>
            {aminoAcid.name} ({aminoAcid.abbreviation3})
          </strong>
          <p className="text-justify">{aminoAcid.about}</p>
        </div>
      </>
    );
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

  const handleDatabaseChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSelectedDatabase(selectedValue);

    setShowChooseOption(selectedValue === "");

    const selectedOption = document.querySelector(
      `option[value="${selectedValue}"]`
    );
    if (selectedOption) {
      setSelectedContent(selectedOption.textContent || "");
    } else {
      setSelectedContent(""); // Penanganan jika selectedOption null
    }
  };
  const handleToastClick = () => {
    if (selectedDatabase == "") {
      toast.warn("Mohon untuk memilih tipe kode DNA terlebih dahulu.");
    }
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
              <p>Mohon tunggu sebentar...</p>
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
                <h1 className="font-bold text-[35px] text-center  ">
                  Hasil Konversi ({selectedContent})
                </h1>
                <div className="flex justify-center gap-5 mb-5">
                  <button
                    onClick={() => setAnalyzeTab("AminoAcid")}
                    className="border-2 w-[220px] rounded-[5px] bg-[#8884d8] text-[18px]  text-white"
                  >
                    Analisis Asam Amino
                  </button>
                  <button
                    onClick={() => setAnalyzeTab("Enzyme")}
                    className="border-2 w-[150px] rounded-[5px] bg-[#8884d8] text-[18px] text-white"
                  >
                    Analisis Enzim
                  </button>
                </div>
              </div>

              {analyzeTab === "AminoAcid" && (
                <>
                  <div className="lg:flex">
                    <div className="border-2 p-5 rounded-xl lg:w-1/2 lg:me-5">
                      <h2 className="font-bold text-[30px]">Tinjauan</h2>
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

                              const { aminoAcid, shortName, count } =
                                aminoAcidInfo;
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
                      <div>
                        <p className=" mt-5 font-bold text-[15px]">
                          Keterangan:
                        </p>
                        <ul className="list-disc list-inside ">
                          <li className=" font-semibold">
                            Total Asam Amino: {totalAminoAcids} Asam Amino
                          </li>
                          <li className="font-semibold">
                            Total Jenis Asam Amino: {totalAminoAcidTypes} Jenis
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="max-lg:mt-5 lg:w-1/2 rounded-xl">
                      <div className=" p-5 border-2 rounded-xl ">
                        {result}
                        <h2 className=" font-bold text-[30px]">
                          Tentang Asam Amino:
                        </h2>
                        <Slider {...settings}>
                          {Object.keys(aminoAcidCountResult).map(
                            (aminoAcid) => (
                              <div key={aminoAcid} className="px-1">
                                <p className="text-justify">
                                  {getAboutInformation(aminoAcid)}
                                </p>
                              </div>
                            )
                          )}
                        </Slider>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col border-2 p-5 rounded-xl mt-5 relative overflow-x-auto ">
                    <h1 className="font-bold text-[30px]">
                      Tabel Klasifikasi:
                    </h1>
                    <div>
                      <table className="w-full divide-y divide-gray-200 rounded-xl">
                        <thead className="bg-[#8884d8]">
                          <tr>
                            <th className="text-white p-4">Klasifikasi</th>
                            <th className="text-white p-4">
                              Polaritas (Polar/Nonpolar)
                            </th>
                            <th className="text-white p-4">Nama Asam Amino</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <th>Acidic</th>
                            <td className="p-4">Polar</td>
                            <td>
                              {Object.entries(aminoAcidCountResult)
                                .map(([aminoAcid, count]) => {
                                  const aminoAcidData = codonMap.find(
                                    (item) => item.abbreviation1 === aminoAcid
                                  );
                                  if (!aminoAcidData)
                                    return (
                                      <p key={aminoAcid}>Tidak Tersedia</p>
                                    );

                                  const isClass =
                                    aminoAcidData.charge.toLowerCase() ===
                                    "acidic";

                                  if (isClass) {
                                    const aminoAcidName = aminoAcidData?.name;
                                    return aminoAcidName ? aminoAcidName : "";
                                  }

                                  return ""; // Return empty string for non-acidic amino acids
                                })
                                .filter((name) => name) // Filter out empty strings
                                .join(", ")}{" "}
                              {/* Join names with comma */}
                            </td>
                          </tr>
                          <tr>
                            <th>Basic</th>
                            <td className="p-4">Polar</td>
                            <td>
                              {Object.entries(aminoAcidCountResult)
                                .map(([aminoAcid, count]) => {
                                  const aminoAcidData = codonMap.find(
                                    (item) => item.abbreviation1 === aminoAcid
                                  );
                                  if (!aminoAcidData)
                                    return (
                                      <p key={aminoAcid}>Tidak Tersedia</p>
                                    );

                                  const isClass =
                                    aminoAcidData.charge.toLowerCase() ===
                                    "basic";

                                  if (isClass) {
                                    const aminoAcidName = aminoAcidData?.name;
                                    return aminoAcidName ? aminoAcidName : "";
                                  }

                                  return ""; // Return empty string for non-acidic amino acids
                                })
                                .filter((name) => name) // Filter out empty strings
                                .join(", ")}{" "}
                              {/* Join names with comma */}
                            </td>
                          </tr>
                          <tr>
                            <th rowSpan={2}>Neutral</th>
                            <td className="p-4">Polar</td>
                            <td>
                              {Object.entries(aminoAcidCountResult)
                                .map(([aminoAcid, count]) => {
                                  const aminoAcidData = codonMap.find(
                                    (item) => item.abbreviation1 === aminoAcid
                                  );
                                  if (!aminoAcidData) return null;

                                  const isClass =
                                    aminoAcidData.charge.toLowerCase() ===
                                    "neutral";
                                  const isPolarity =
                                    aminoAcidData.polarity.toLowerCase() ===
                                    "polar";

                                  if (isClass && isPolarity) {
                                    return aminoAcidData?.name;
                                  } else {
                                    return null; // Return null for non-matching amino acids
                                  }
                                })
                                .filter((name) => name) // Filter out null values
                                .join(", ")}{" "}
                              {/* Join names with comma */}
                            </td>
                          </tr>
                          <tr>
                            <td className="p-4">Nonpolar</td>
                            <td>
                              {Object.entries(aminoAcidCountResult)
                                .map(([aminoAcid, count]) => {
                                  const aminoAcidData = codonMap.find(
                                    (item) => item.abbreviation1 === aminoAcid
                                  );
                                  if (!aminoAcidData) return null;

                                  const isClass =
                                    aminoAcidData.charge.toLowerCase() ===
                                    "neutral";
                                  const isPolarity =
                                    aminoAcidData.polarity.toLowerCase() ===
                                    "nonpolar";

                                  if (isClass && isPolarity) {
                                    return aminoAcidData?.name;
                                  } else {
                                    return null; // Return null for non-matching amino acids
                                  }
                                })
                                .filter((name) => name) // Filter out null values
                                .join(", ")}{" "}
                              {/* Join names with comma */}
                            </td>
                          </tr>
                          <tr>
                            <th>Aliphatic</th>
                            <td className="p-4">Nonpolar</td>
                            <td>
                              {Object.entries(aminoAcidCountResult)
                                .map(([aminoAcid, count]) => {
                                  const aminoAcidData = codonMap.find(
                                    (item) => item.abbreviation1 === aminoAcid
                                  );
                                  if (!aminoAcidData)
                                    return (
                                      <p key={aminoAcid}>Tidak Tersedia</p>
                                    );

                                  const isClass =
                                    aminoAcidData.charge.toLowerCase() ===
                                    "aliphatic";

                                  if (isClass) {
                                    const aminoAcidName = aminoAcidData?.name;
                                    return aminoAcidName ? aminoAcidName : "";
                                  }

                                  return ""; // Return empty string for non-acidic amino acids
                                })
                                .filter((name) => name) // Filter out empty strings
                                .join(", ")}{" "}
                              {/* Join names with comma */}
                            </td>
                          </tr>
                          <tr>
                            <th>Aromatic</th>
                            <td className="p-4">Nonpolar</td>
                            <td>
                              {Object.entries(aminoAcidCountResult)
                                .map(([aminoAcid, count]) => {
                                  const aminoAcidData = codonMap.find(
                                    (item) => item.abbreviation1 === aminoAcid
                                  );
                                  if (!aminoAcidData)
                                    return (
                                      <p key={aminoAcid}>Tidak Tersedia</p>
                                    );

                                  const isClass =
                                    aminoAcidData.charge.toLowerCase() ===
                                    "aromatic";

                                  if (isClass) {
                                    const aminoAcidName = aminoAcidData?.name;
                                    return aminoAcidName ? aminoAcidName : "";
                                  }

                                  return ""; // Return empty string for non-acidic amino acids
                                })
                                .filter((name) => name) // Filter out empty strings
                                .join(", ")}{" "}
                              {/* Join names with comma */}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <TableDetails querySequence={dnaSequence} />
                </>
              )}
              {analyzeTab === "Enzyme" && (
                <EnzymeAnalysis querySequence={dnaSequence} />
              )}
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
              Konverter Urutan DNA/RNA
            </h1>
            <label className="my-5">
              <p className="text-center font-semibold">Pilih Kode DNA:</p>
              <select
                value={selectedDatabase}
                onChange={handleDatabaseChange}
                className="border rounded-xl h-[40px] px-2 w-[400px]"
              >
                {showChooseOption && <option value="">Pilih Tipe Kode</option>}
                <optgroup label="Kode Mitokondria">
                  <option value="vertebrateMitochondrial">
                    The Vertebrate Mitochondrial Code
                  </option>
                  <option value="yeastMitochondrial">
                    The Yeast Mitochondrial Code
                  </option>
                  <option value="moldProtozoanCoelenterateMitochondrial">
                    The Mold, Protozoan, and Coelenterate Mitochondrial Code and
                    the Mycoplasma/Spiroplasma Code
                  </option>
                  <option value="invertebrateMitochondrial">
                    The Invertebrate Mitochondrial Code
                  </option>
                  <option value="echinodermFlatwormMitochondrial">
                    The Echinoderm and Flatworm Mitochondrial Code
                  </option>
                  <option value="ascidianMitochondrial">
                    The Ascidian Mitochondrial Code
                  </option>
                  <option value="alternativeFlatwormMitochondrial">
                    The Alternative Flatworm Mitochondrial Code
                  </option>
                  <option value="trematodeMitochondrial">
                    Trematode Mitochondrial Code
                  </option>
                  <option value="scenedesmusObliquusMitochondrial">
                    Scenedesmus obliquus Mitochondrial Code
                  </option>
                  <option value="thraustochytriumMitochondrial">
                    Thraustochytrium Mitochondrial Code
                  </option>
                  <option value="rhabdopleuridaeMitochondrial">
                    Rhabdopleuridae Mitochondrial Code
                  </option>
                  <option value="cephalodiscidaeMitochondrialUAATyr">
                    Cephalodiscidae Mitochondrial UAA-Tyr Code
                  </option>
                </optgroup>
                <optgroup label="Kode Inti">
                  <option value="ciliateDasycladaceanHexamitaNuclear">
                    The Ciliate, Dasycladacean and Hexamita Nuclear Code
                  </option>
                  <option value="euplotidNuclear">
                    The Euplotid Nuclear Code
                  </option>
                  <option value="alternativeYeastNuclear">
                    The Alternative Yeast Nuclear Code
                  </option>
                  <option value="blepharismaNuclear">
                    Blepharisma Nuclear Code
                  </option>
                  <option value="pachysolenTannophilusNuclear">
                    Pachysolen tannophilus Nuclear Code
                  </option>
                  <option value="karyorelictNuclear">
                    Karyorelict Nuclear Code
                  </option>
                  <option value="condylostomaNuclear">
                    Condylostoma Nuclear Code
                  </option>
                  <option value="mesodiniumNuclear">
                    Mesodinium Nuclear Code
                  </option>
                  <option value="peritrichNuclear">
                    Peritrich Nuclear Code
                  </option>
                  <option value="blastocrithidiaNuclear">
                    Blastocrithidia Nuclear Code
                  </option>
                </optgroup>
                <optgroup label="Lainnya">
                  <option value="standardCode">The Standard Code</option>
                  <option value="bacterialArchaealPlantPlastid">
                    The Bacterial, Archaeal and Plant Plastid Code
                  </option>
                  <option value="chlorophyceanMitochondrial">
                    Chlorophycean Mitochondrial Code
                  </option>
                  <option value="candidateDivisionSR1Gracilibacteria">
                    Candidate Division SR1 and Gracilibacteria Code
                  </option>
                </optgroup>
              </select>
            </label>
            <div className="flex flex-col">
              <label className="font-semibold">Pilih Tipe Urutan:</label>
              <label className="flex">
                <input
                  type="radio"
                  value="dna"
                  checked={isDNA}
                  onChange={handleRadioChange}
                  className="me-1"
                />
                DNA (A, C, T, dan G)
              </label>
              <label className="flex">
                <input
                  type="radio"
                  className="me-1"
                  value="rna"
                  checked={!isDNA}
                  onChange={handleRadioChange}
                />
                RNA (A, C, U, dan G)
              </label>
            </div>
            {showSpecificButton && (
              <div className="flex flex-col my-5">
                <label className="font-semibold">
                  Pilih Opsi Kodon Pemberhenti:
                </label>
                <label className="flex">
                  <input
                    type="radio"
                    value="specific"
                    checked={!useTerminatorAsStopCodon} // jika bukan menggunakan terminator sebagai stop codon
                    onChange={handleTerminatorRadioChange}
                    className="me-1"
                  />
                  Kodon Pemberhenti Yang Spesifik
                </label>
                <label className="flex">
                  <input
                    type="radio"
                    className="me-1"
                    value="terminator"
                    checked={useTerminatorAsStopCodon} // jika menggunakan terminator sebagai stop codon
                    onChange={handleTerminatorRadioChange}
                  />
                  Pemberhenti Kodon
                </label>
              </div>
            )}

            <div className={showSpecificButton ? "" : "mt-5"}>
              <input {...getInputProps()} />
              <label
                htmlFor="fileInput"
                className="inline-flex rounded-md text-white   bg-[#8884d8] h-[80px] w-[300px] font-semibold text-[25px] text-center justify-center items-center hover:bg-[#5b58a1] "
                onClick={handleToastClick}
              >
                Pilih TXT File
              </label>
              {selectedDatabase ? (
                <input
                  id="fileInput"
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
              ) : (
                ""
              )}
              <p className="mt-5 text-center">
                {isDragActive
                  ? "Letakan file di sini"
                  : "Atau letakan file di sini"}
              </p>
            </div>
          </div>
        </div>
      )}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Slide}
      />
    </div>
  );
};

export default CodonConverter;
