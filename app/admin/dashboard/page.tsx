"use client";
import { ChangeEvent, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase/init"; // Sesuaikan path ke file firebase.ts
import DeleteConfirmation from "../../components/modals/DeleteConfirmation";
import FormComponent from "@/app/components/adminComponents/FormComponent";
import DataDisplayComponent from "@/app/components/adminComponents/DataComponent";

interface Option {
  label: string;
  value: string;
}

interface Optgroup {
  category: string;
  options: Option[];
}

interface AminoAcidData {
  id: string;
  nama: string;
  abbr1: string;
  abbr3: string;
  dna: string[]; // Update the type of dna
  rna: string[];
  abt: string;
  timestamp: any;
}
interface OptionCode {
  category: string;
  options: {
    label: string;
    value: string;
  };
}
const InputForm: React.FC = () => {
  const [formValues, setFormValues] = useState({
    nama: "",
    abbr1: "",
    abbr3: "",
    dna: "",
    rna: "",
    abt: "",
  });
  const [data, setData] = useState<AminoAcidData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null); // State untuk ID yang sedang diedit
  const [dynamicDNAInputs, setDynamicDNAInputs] = useState<string[]>([""]);
  const [dynamicRNAInputs, setDynamicRNAInputs] = useState<string[]>([""]);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<string>(""); // State untuk memantau database mana yang dipilih
  // const [optionsData, setOptionsData] = useState<Optgroup[]>([]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const aminoAcidCollection = collection(db, `allCodeTypes`);
  //       const querySnapshot = await getDocs(aminoAcidCollection);

  //       const options: Optgroup[] = [];
  //       querySnapshot.forEach((doc) => {
  //         const data = doc.data();
  //         const optgroup: Optgroup = {
  //           category: doc.id,
  //           options: data.map((option: any) => ({
  //             label: option.label,
  //             value: option.value,
  //           })),
  //         };
  //         options.push(optgroup);
  //       });
  //       setOptionsData(options);
  //       console.log(optionsData);
  //     } catch (error) {
  //       console.error("Error fetching data: ", error);
  //     }
  //   };

  //   fetchData();
  // }, [db]);

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
      const optionCodeCollection = collection(db, `${selectedDatabase}`);
      const queryOptionSnapshot = await getDocs(aminoAcidCollection);
      console.log(queryOptionSnapshot);

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

  //CREATE / EDIT
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi untuk memastikan setidaknya satu input dna diisi
    if (dynamicDNAInputs.every((input) => input === "")) {
      console.error("Harap isi setidaknya satu input DNA.");
      return;
    }
    // Validasi untuk memastikan setidaknya satu input dna diisi
    if (dynamicRNAInputs.every((input) => input === "")) {
      console.error("Harap isi setidaknya satu input RNA.");
      return;
    }

    try {
      if (editingId) {
        // Jika ada ID yang sedang diedit, lakukan pembaruan data
        await updateDoc(doc(db, `${selectedDatabase}`, editingId), {
          ...formValues,
          dna: dynamicDNAInputs.filter((item) => item !== ""),
          rna: dynamicRNAInputs.filter((item) => item !== ""),
          timestamp: new Date(),
        });

        console.log("Document updated with ID: ", editingId);
        setEditingId(null); // Keluar dari mode edit setelah pembaruan
      } else {
        // Jika tidak ada ID yang sedang diedit, tambahkan data baru
        const docRef = await addDoc(collection(db, `${selectedDatabase}`), {
          ...formValues,
          dna: dynamicDNAInputs.filter((item) => item !== ""),
          rna: dynamicRNAInputs.filter((item) => item !== ""),
          timestamp: new Date(),
        });

        console.log("Document written with ID: ", docRef.id);
      }

      // Bersihkan formulir setelah submit
      setFormValues({
        nama: "",
        abbr1: "",
        abbr3: "",
        dna: "",
        rna: "",
        abt: "",
      });
      setDynamicDNAInputs([""]);
      setDynamicRNAInputs([""]);

      // Perbarui data setelah penambahan atau pembaruan
      const updatedData = await fetchData();
      setData(updatedData);
    } catch (error) {
      console.error("Error handling form submission: ", error);
    }
  };

  // EDIT
  const handleEdit = (id: string) => {
    const editedData = data.find((item) => item.id === id);

    setFormValues({
      nama: editedData?.nama || "",
      abbr1: editedData?.abbr1 || "",
      abbr3: editedData?.abbr3 || "",
      dna: "",
      rna: "",
      abt: editedData?.abt || "",
    });

    setEditingId(id);
    setDynamicDNAInputs(editedData?.dna || []);
    setDynamicRNAInputs(editedData?.rna || []);
    setIsEditMode(true);
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
    });

    setDynamicDNAInputs([""]);
    setDynamicRNAInputs([""]);
    setEditingId(null);
    setIsEditMode(false);
    document.getElementById("submit-button")!.textContent = "Submit";
  };

  //DELETE
  const handleDelete = async (id: string) => {
    try {
      // Hapus dokumen dengan ID tertentu dari koleksi `${selectedDatabase}`
      // Gunakan fungsi deleteDoc dari firestore
      await deleteDoc(doc(db, `${selectedDatabase}`, id));
      console.log("Document deleted with ID: ", id);

      // Perbarui data setelah penghapusan
      const updatedData = data.filter((item) => item.id !== id);
      setData(updatedData);
    } catch (error) {
      console.error("Error deleting document: ", error);
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

  // Fungsi untuk menyalin koleksi
  const copyCollection = async (
    sourceCollection: string,
    destinationCollection: string
  ) => {
    try {
      // Ambil data dari koleksi sumber
      const sourceCollectionRef = collection(db, sourceCollection);
      const querySnapshot = await getDocs(sourceCollectionRef);

      // Iterasi melalui dokumen dan tulis ke koleksi tujuan
      querySnapshot.forEach(async (doc) => {
        await addDoc(collection(db, destinationCollection), doc.data());
      });

      console.log(`Collection copied successfully, ${selectedDatabase}!`);
    } catch (error) {
      console.error("Error copying collection:", error);
    }
  };

  const handleCopyCollection = async () => {
    const originalCollectionName = "standardCode"; // Ganti dengan nama koleksi asli Anda
    const newCollectionName = `${selectedDatabase}`; // Ganti dengan nama koleksi baru yang Anda inginkan

    await copyCollection(originalCollectionName, newCollectionName);
  };
  return (
    <>
      <div>
        <label>
          Pilih Database:
          <select value={selectedDatabase} onChange={handleDatabaseChange}>
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
          {/* <select value={selectedDatabase} onChange={handleDatabaseChange}>
            {optionsData.map((optgroup, index) => (
              <optgroup label={optgroup.category} key={index}>
                {optgroup.options.map((option, optionIndex) => (
                  <option value={option.value} key={optionIndex}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select> */}
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
      />
      <DataDisplayComponent
        data={data}
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
