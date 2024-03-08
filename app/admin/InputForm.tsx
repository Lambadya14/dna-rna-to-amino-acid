// components/InputForm.tsx
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase/init"; // Sesuaikan path ke file firebase.ts
import DeleteConfirmation from "../components/modals/DeleteConfirmation";

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
      const aminoAcidCollection = collection(db, "aminoAcid");
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
        await updateDoc(doc(db, "aminoAcid", editingId), {
          ...formValues,
          dna: dynamicDNAInputs.filter((item) => item !== ""),
          rna: dynamicRNAInputs.filter((item) => item !== ""),
          timestamp: new Date(),
        });

        console.log("Document updated with ID: ", editingId);
        setEditingId(null); // Keluar dari mode edit setelah pembaruan
      } else {
        // Jika tidak ada ID yang sedang diedit, tambahkan data baru
        const docRef = await addDoc(collection(db, "aminoAcid"), {
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
      // Hapus dokumen dengan ID tertentu dari koleksi "aminoAcid"
      // Gunakan fungsi deleteDoc dari firestore
      await deleteDoc(doc(db, "aminoAcid", id));
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
        const aminoAcidCollection = collection(db, "aminoAcid");
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
  }, []); // Empty dependency array ensures useEffect runs only once after component mount

  useEffect(() => {
    const fetchDataOnMount = async () => {
      const initialData = await fetchData();
      setData(initialData);
    };

    fetchDataOnMount();
  }, []);

  return (
    <>
      <form className="flex flex-col px-5" onSubmit={handleFormSubmit}>
        <div className="flex justify-between">
          <div className="w-1/2 flex flex-col me-3 font-semibold">
            <label htmlFor="nama">Nama Asam Amino</label>
            <input
              className="border p-3 -2 rounded-lg mb-3"
              type="text"
              id="nama"
              value={formValues.nama}
              onChange={handleInputChange}
            />
            <label htmlFor="abbr1">Singkatan 1</label>
            <input
              className="border p-3 -2 rounded-lg  mb-3"
              type="text"
              id="abbr1"
              maxLength={1}
              value={formValues.abbr1}
              pattern="[A-Za-z]+"
              onChange={handleInputChange}
            />
            <label htmlFor="abbr3">Singkatan 3</label>
            <input
              className="border p-3 -2 rounded-lg  mb-3"
              type="text"
              id="abbr3"
              maxLength={3}
              value={formValues.abbr3}
              onChange={handleInputChange}
            />
            <label htmlFor="dna">DNA (A, C, T, dan G)</label>
            {dynamicDNAInputs.map((input, index) => (
              <div key={index} className="relative flex">
                <input
                  className="border p-3 -2 rounded-lg w-full "
                  type="text"
                  id={index.toString()}
                  value={input}
                  maxLength={3}
                  onChange={handleDynamicDNAInputChange}
                />
                {index === dynamicDNAInputs.length - 1 && (
                  <button
                    type="button"
                    onClick={handleAddDynamicDNAInput}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-[30px]"
                  >
                    +
                  </button>
                )}
                {dynamicDNAInputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDynamicDNAInput(index)}
                    className="absolute right-16 top-1/2 transform -translate-y-1/2 text-[30px]"
                  >
                    -
                  </button>
                )}
              </div>
            ))}

            <label htmlFor="rna" className="mt-3">
              RNA (A, C, U, dan G)
            </label>
            {dynamicRNAInputs.map((input, index) => (
              <div key={index} className="relative flex">
                <input
                  className="border p-3 -2 rounded-lg w-full"
                  type="text"
                  id={index.toString()}
                  value={input}
                  maxLength={3}
                  onChange={handleDynamicRNAInputChange}
                />
                {index === dynamicRNAInputs.length - 1 && (
                  <button
                    type="button"
                    onClick={handleAddDynamicRNAInput}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-[30px]"
                  >
                    +
                  </button>
                )}
                {dynamicRNAInputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDynamicRNAInput(index)}
                    className="absolute right-16 top-1/2 transform -translate-y-1/2 text-[30px]"
                  >
                    -
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="w-1/2 flex flex-col">
            <label htmlFor="abt">About</label>
            <textarea
              className="border p-3 -2 rounded-lg h-full"
              id="abt"
              value={formValues.abt}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="flex justify-center">
          {isEditMode && (
            <button
              className="rounded-md h-[40px] w-full me-3 my-3 bg-[#d9534f] text-white"
              type="button"
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
          <button
            id="submit-button"
            className="rounded-md h-[40px] w-full my-3 bg-[#098c28] text-white"
            type="submit"
          >
            {isEditMode ? "Update" : "Submit"}
          </button>
        </div>
      </form>

      <div className="p-5">
        <table className="w-full text-center ">
          <thead className="border-b-2">
            <tr>
              <th>Nama Asam Amino</th>
              <th>Singkatan 1 Huruf</th>
              <th>Singkatan 3 Huruf</th>
              <th>DNA</th>
              <th>RNA</th>
              <th>About</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.id}
                className={index % 2 === 0 ? "bg-[#b6b6b6]" : ""}
              >
                <td className=" p-3 ">{item.nama}</td>
                <td className=" p-3 ">{item.abbr1}</td>
                <td className=" p-3 ">{item.abbr3}</td>
                <td className=" p-3 ">{item.dna.join(", ")}</td>
                <td className=" p-3 ">{item.rna.join(", ")}</td>
                <td className="border-s border-e px-4 py-2 group">
                  <div className="overflow-hidden line-clamp-3 group-hover:line-clamp-none text-justify">
                    {item.abt}
                  </div>
                </td>

                <td className=" p-3 flex-col">
                  <button onClick={() => handleEdit(item.id)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="25px"
                      height="25px"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="#2483cc"
                        d="m18.988 2.012l3 3L19.701 7.3l-3-3zM8 16h3l7.287-7.287l-3-3L8 13z"
                      />
                      <path
                        fill="#2483cc"
                        d="M19 19H8.158c-.026 0-.053.01-.079.01c-.033 0-.066-.009-.1-.01H5V5h6.847l2-2H5c-1.103 0-2 .896-2 2v14c0 1.104.897 2 2 2h14a2 2 0 0 0 2-2v-8.668l-2 2z"
                      />
                    </svg>
                  </button>
                  {/* Tombol delete */}
                  <button onClick={() => handleDeleteConfirmation(item.id)}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="25px"
                      height="25px"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="#cc0606"
                        d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6z"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default InputForm;
