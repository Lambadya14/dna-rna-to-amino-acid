"use client";
import { ChangeEvent, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase/init"; // Sesuaikan path ke file firebase.ts
import DeleteConfirmation from "../../components/modals/DeleteConfirmation";
import FormComponent from "@/app/components/adminComponents/FormComponent";
import DataDisplayComponent from "@/app/components/adminComponents/DataComponent";

interface AminoAcidData {
  id: string;
  nama: string;
  abbr1: string;
  abbr3: string;
  dna: string[]; // Update the type of dna
  rna: string[];
  abt: string;
  timestamp: any;
  directory: string;
  charge: string;
}

const InputForm: React.FC = () => {
  const [formValues, setFormValues] = useState({
    nama: "",
    abbr1: "",
    abbr3: "",
    dna: "",
    rna: "",
    abt: "",
    directory: "",
    charge: "",
  });
  const [file, setFile] = useState<File>();
  const [filteredData, setFilteredData] = useState<AminoAcidData[]>([]);
  const [data, setData] = useState<AminoAcidData[]>([]);
  const [filterValue, setFilterValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null); // State untuk ID yang sedang diedit
  const [dynamicDNAInputs, setDynamicDNAInputs] = useState<string[]>([""]);
  const [dynamicRNAInputs, setDynamicRNAInputs] = useState<string[]>([""]);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<string>(""); // State untuk memantau database mana yang dipilih
  const [isLoading, setIsLoading] = useState(false);
  const [charge, setCharge] = useState<string>("");

  const handleChargeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setCharge(value);
  };

  const handleDeleteConfirmation = (id: string) => {
    setDeletingItemId(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingItemId) {
      await handleDelete(deletingItemId);
      setDeleteModalOpen(false);
      setDeletingItemId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setDeletingItemId(null);
  };

  const handleDynamicDNAInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { id, value } = e.target;

    // Validasi untuk input DNA
    if (!isValidACTG(value)) {
      console.error("Input DNA hanya boleh mengandung huruf A, C, T, dan G.");
      return;
    }

    const updatedInputs = [...dynamicDNAInputs];
    updatedInputs[parseInt(id, 10)] = value.toUpperCase();
    setDynamicDNAInputs(updatedInputs);
  };

  const handleAddDynamicDNAInput = () => {
    setDynamicDNAInputs((prevInputs) => [...prevInputs, ""]);
  };

  const handleRemoveDynamicDNAInput = (index: number) => {
    setDynamicDNAInputs((prevInputs) => {
      const updatedInputs = [...prevInputs];
      updatedInputs.splice(index, 1);
      return updatedInputs;
    });
  };
  const handleDynamicRNAInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { id, value } = e.target;

    // Validasi untuk input RNA
    if (!isValidACUG(value)) {
      console.error("Input RNA hanya boleh mengandung huruf A, C, U, dan G.");
      return;
    }

    const updatedInputs = [...dynamicRNAInputs];
    updatedInputs[parseInt(id, 10)] = value.toUpperCase();
    setDynamicRNAInputs(updatedInputs);
  };

  const handleAddDynamicRNAInput = () => {
    setDynamicRNAInputs((prevInputs) => [...prevInputs, ""]);
  };

  const handleRemoveDynamicRNAInput = (index: number) => {
    setDynamicRNAInputs((prevInputs) => {
      const updatedInputs = [...prevInputs];
      updatedInputs.splice(index, 1);
      return updatedInputs;
    });
  };

  // Fungsi untuk memeriksa apakah suatu urutan hanya mengandung huruf A, C, U, dan G
  const isValidACUG = (sequence: string): boolean => {
    const allowedCharacters = new Set(["A", "C", "U", "G"]);

    for (let i = 0; i < sequence.length; i++) {
      if (!allowedCharacters.has(sequence[i].toUpperCase())) {
        return false;
      }
    }

    return true;
  };

  // Fungsi untuk memeriksa apakah suatu urutan hanya mengandung huruf A, C, T, dan G
  const isValidACTG = (sequence: string): boolean => {
    const allowedCharacters = new Set(["A", "C", "T", "G"]);

    for (let i = 0; i < sequence.length; i++) {
      if (!allowedCharacters.has(sequence[i].toUpperCase())) {
        return false;
      }
    }

    return true;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;

    // Validasi untuk input huruf saja pada abbr1, abbr3, dna, dan rna
    if (
      ["abbr1", "abbr3", "dna", "rna"].includes(id) &&
      !/^[a-zA-Z]*$/.test(value)
    ) {
      console.error(`Input ${id.toUpperCase()} hanya boleh mengandung huruf.`);
      return;
    }

    // Menggunakan upper case hanya untuk input dna, rna, abbr1, dan abbr3
    const uppercaseValue = ["dna", "rna", "abbr1"].includes(id)
      ? value.toUpperCase()
      : value;

    setFormValues((prevValues) => ({
      ...prevValues,
      [id]: uppercaseValue,
    }));
  };

  const fetchData = async () => {
    try {
      const aminoAcidCollection = collection(db, `${selectedDatabase}`);
      const querySnapshot = await getDocs(aminoAcidCollection);

      const fetchedData: AminoAcidData[] = [];
      querySnapshot.forEach((doc) => {
        fetchedData.push({
          id: doc.id,
          ...doc.data(),
        } as AminoAcidData);
      });

      setData(fetchedData);
      return fetchedData;
    } catch (error) {
      console.error("Error fetching data: ", error);
      return [];
    }
  };

  const handleFileSubmit = (e: ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    setFile(uploadedFile);
  };

  const clearInputFile = () => {
    const inputFile = document.getElementById("inputFile") as HTMLInputElement;
    if (inputFile) {
      inputFile.value = ""; // Mengatur nilai input file menjadi string kosong
    }
  };

  //CREATE / EDIT
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi untuk memastikan setidaknya satu input DNA dan RNA diisi
    if (
      dynamicDNAInputs.every((input) => input === "") ||
      dynamicRNAInputs.every((input) => input === "")
    ) {
      console.error("Harap isi setidaknya satu input DNA dan RNA.");
      return;
    }

    try {
      setIsLoading(true); // Set loading state to true

      if (editingId) {
        try {
          if (!file || file.name === "") {
            // Jika tidak ada file yang dipilih, tetapkan directory yang ada sebelumnya
            const previousDoc = await getDoc(
              doc(db, `${selectedDatabase}`, editingId)
            );
            const previousDirectory = previousDoc.exists()
              ? previousDoc.data().directory
              : "";

            await updateDoc(doc(db, `${selectedDatabase}`, editingId), {
              ...formValues,
              dna: dynamicDNAInputs.filter((item) => item !== ""),
              rna: dynamicRNAInputs.filter((item) => item !== ""),
              timestamp: new Date(),
              directory: previousDirectory,
              charge: charge,
            });

            console.log("Document updated with ID:", editingId);
          } else {
            const data = new FormData();
            data.append("nama", editingId);
            data.set("file", file);
            const res = await fetch("/api/file/upload", {
              method: "POST",
              body: data,
            });
            const response = await res.json();

            console.log("Upload response:", response);

            if (!response.success) {
              throw new Error(response.message);
            }

            const directory = response.targetPath;

            // Update data if editing
            await updateDoc(doc(db, `${selectedDatabase}`, editingId), {
              ...formValues,
              dna: dynamicDNAInputs.filter((item) => item !== ""),
              rna: dynamicRNAInputs.filter((item) => item !== ""),
              timestamp: new Date(),
              directory: directory,
              charge: charge,
            });

            console.log("Document updated with ID:", editingId);
          }
        } catch (error) {
          console.error("Error updating document:", error);
        }
      } else {
        try {
          if (!file || file.name === "") {
            console.log(
              "Tidak ada file yang dipilih, tidak ada pengubahan data yang dilakukan."
            );
          } else {
            const data = new FormData();
            const docRef = await addDoc(collection(db, `${selectedDatabase}`), {
              ...formValues,
              dna: dynamicDNAInputs.filter((item) => item !== ""),
              rna: dynamicRNAInputs.filter((item) => item !== ""),
              timestamp: new Date(),
              charge: charge,
            });

            data.append("nama", docRef.id);
            data.set("file", file);
            const res = await fetch("/api/file/upload", {
              method: "POST",
              body: data,
            });
            const response = await res.json();

            if (!response.success) {
              throw new Error(response.message);
            }

            const directory = response.targetPath;

            // Update the document with the directory information
            await updateDoc(doc(db, `${selectedDatabase}`, docRef.id), {
              ...formValues,
              directory: directory,
            });
            console.log("Document written with ID:", docRef.id);
          }
        } catch (error) {
          console.error("Error handling file upload:", error);
          return;
        }
      }

      // Clear form after submission
      setFormValues({
        nama: "",
        abbr1: "",
        abbr3: "",
        dna: "",
        rna: "",
        abt: "",
        directory: "",
        charge: "",
      });
      setDynamicDNAInputs([""]);
      setDynamicRNAInputs([""]);
      setFile(undefined); // Menetapkan nilai string input file kembali ke kosong setelah formulir dikosongkan

      // Perbarui data setelah penambahan atau pembaruan
      const updatedData = await fetchData();
      setData(updatedData);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error handling form submission:", error);
    } finally {
      setIsLoading(false); // Set loading state to false regardless of success or failure
    }
  };

  // EDIT
  const handleEdit = (id: string) => {
    const targetElement = document.getElementById("nama");
    if (targetElement) {
      const offsetTop = targetElement.offsetTop;
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      });
    }
    const editedData = data.find((item) => item.id === id);

    setFormValues({
      nama: editedData?.nama || "",
      abbr1: editedData?.abbr1 || "",
      abbr3: editedData?.abbr3 || "",
      dna: "",
      rna: "",
      abt: editedData?.abt || "",
      directory: "",
      charge: "",
    });

    setEditingId(id);
    setDynamicDNAInputs(editedData?.dna || []);
    setDynamicRNAInputs(editedData?.rna || []);
    setIsEditMode(true);
    clearInputFile();

    document.getElementById("submit-button")!.textContent = "Update";
  };

  //CANCEL EDIT
  const handleCancel = () => {
    setFormValues({
      nama: "",
      abbr1: "",
      abbr3: "",
      dna: "",
      rna: "",
      abt: "",
      directory: "",
      charge: "",
    });

    setDynamicDNAInputs([""]);
    setDynamicRNAInputs([""]);
    setEditingId(null);
    setIsEditMode(false);
    document.getElementById("submit-button")!.textContent = "Submit";
    clearInputFile();
  };

  //DELETE
  const handleDelete = async (id: string) => {
    try {
      // Kirim permintaan DELETE ke endpoint
      const response = await fetch("/api/file/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: id }), // Menggunakan ID dokumen sebagai payload
      });

      await deleteDoc(doc(db, `${selectedDatabase}`, id));
      console.log("Document deleted with ID: ", id);

      // Perbarui data setelah penghapusan
      const updatedData = data.filter((item) => item.id !== id);
      setData(updatedData);

      // Periksa status respons
      if (!response.ok) {
        throw new Error("Gagal menghapus file.");
      }

      console.log(`File dengan ID ${id} berhasil dihapus.`);
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const aminoAcidCollection = collection(db, `${selectedDatabase}`); // Gunakan selectedDatabase untuk memilih koleksi yang sesuai
        const querySnapshot = await getDocs(aminoAcidCollection);

        const fetchedData: AminoAcidData[] = [];
        querySnapshot.forEach((doc) => {
          fetchedData.push({
            id: doc.id,
            ...doc.data(),
          } as AminoAcidData);
        });

        setData(fetchedData);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, [selectedDatabase]); // Tambahkan selectedDatabase sebagai dependensi sehingga useEffect dipanggil ulang saat nilainya berubah

  useEffect(() => {
    const fetchDataOnMount = async () => {
      const initialData = await fetchData();
      setData(initialData);
    };

    fetchDataOnMount();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedDatabase]);

  // Fungsi untuk mengubah database yang dipilih
  const handleDatabaseChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedDatabase(event.target.value);
  };
  // Function to filter data based on criteria
  const filterData = (criteria: string) => {
    const filteredResult = data.filter((item) => {
      const namaMatch = item.nama
        .toLowerCase()
        .includes(criteria.toLowerCase());
      const abbr1Match = item.abbr1
        .toLowerCase()
        .includes(criteria.toLowerCase());
      const abbr3Match = item.abbr3
        .toLowerCase()
        .includes(criteria.toLowerCase());
      const dnaMatch = item.dna.some((sequence) =>
        sequence.toLowerCase().includes(criteria.toLowerCase())
      );
      const rnaMatch = item.rna.some((sequence) =>
        sequence.toLowerCase().includes(criteria.toLowerCase())
      );
      const chargeMatch = item.charge
        ? new RegExp(`\\b${criteria}\\b`, "i").test(item.charge)
        : false;
      return (
        namaMatch ||
        abbr1Match ||
        abbr3Match ||
        dnaMatch ||
        rnaMatch ||
        chargeMatch
      );
    });

    setFilteredData(filteredResult);
  };

  // Handler untuk perubahan filter
  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFilterValue(value); // Update nilai filter

    // Lakukan filtering berdasarkan nilai filter baru
    filterData(value);
  };

  // Effect to re-filter data when the filter value changes
  useEffect(() => {
    // Check if filterValue is empty
    if (filterValue === "") {
      // If filterValue is empty, display the original data without filtering
      setFilteredData(data);
    } else {
      // If filterValue is not empty, perform filtering
      filterData(filterValue);
    }
  }, [filterValue, data]); // Add 'data' as a dependency to handle changes in the original data

  // Fetch initial data when the component mounts
  useEffect(() => {
    fetchData();
  }, []); // Empty dependency array ensures this effect runs only once on component mount

  return (
    <>
      <div className="px-5 py-3">
        <label>
          <p className="font-semibold"> Pilih Database:</p>
          <select
            value={selectedDatabase}
            onChange={handleDatabaseChange}
            className="border rounded-xl h-[40px] px-2 w-full"
          >
            <optgroup label="Mitochondrial Codes">
              <option value="vertebrateMitochondrial">
                The Vertebrate Mitochondrial Code
              </option>
              <option value="yeastMitochondrial">
                The Yeast Mitochondrial Code
              </option>
              <option value="moldProtozoanCoelenterateMitochondrial">
                The Mold, Protozoan, and Coelenterate Mitochondrial Code and the
                Mycoplasma/Spiroplasma Code
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
            <optgroup label="Nuclear Codes">
              <option value="ciliateDasycladaceanHexamitaNuclear">
                The Ciliate, Dasycladacean and Hexamita Nuclear Code
              </option>
              <option value="euplotidNuclear">The Euplotid Nuclear Code</option>
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
              <option value="mesodiniumNuclear">Mesodinium Nuclear Code</option>
              <option value="peritrichNuclear">Peritrich Nuclear Code</option>
              <option value="blastocrithidiaNuclear">
                Blastocrithidia Nuclear Code
              </option>
            </optgroup>
            <optgroup label="Others">
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
        <label>
          <p className="font-semibold"> Filter:</p>
          <input
            type="text"
            className="border  rounded-xl h-[40px] px-3 w-full"
            value={filterValue}
            onChange={handleFilterChange}
            placeholder="Cari..."
          />
        </label>
      </div>

      <FormComponent
        formValues={formValues}
        dynamicDNAInputs={dynamicDNAInputs}
        dynamicRNAInputs={dynamicRNAInputs}
        handleFormSubmit={handleFormSubmit}
        handleInputChange={handleInputChange}
        handleDynamicDNAInputChange={handleDynamicDNAInputChange}
        handleAddDynamicDNAInput={handleAddDynamicDNAInput}
        handleRemoveDynamicDNAInput={handleRemoveDynamicDNAInput}
        handleDynamicRNAInputChange={handleDynamicRNAInputChange}
        handleAddDynamicRNAInput={handleAddDynamicRNAInput}
        handleRemoveDynamicRNAInput={handleRemoveDynamicRNAInput}
        isEditMode={isEditMode}
        handleCancel={handleCancel}
        handleFileSubmit={handleFileSubmit}
        isLoading={isLoading}
        charge={charge}
        handleChargeChange={handleChargeChange}
      />
      <DataDisplayComponent
        data={filteredData}
        handleEdit={handleEdit}
        handleDeleteConfirmation={handleDeleteConfirmation}
      />

      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default InputForm;
