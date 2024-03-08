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
    // Temukan data yang akan diedit berdasarkan ID
    const editedData = data.find((item) => item.id === id);

    // Isi formulir dengan data yang akan diedit
    setFormValues({
      nama: editedData?.nama || "",
      abbr1: editedData?.abbr1 || "",
      abbr3: editedData?.abbr3 || "",
      dna: "", // Kosongkan nilai dna
      rna: "", // Kosongkan nilai rna
      abt: editedData?.abt || "",
    });

    // Set ID yang sedang diedit
    setEditingId(id);

    // Isi nilai dynamicDNAInputs dan dynamicRNAInputs dengan data yang akan diedit
    setDynamicDNAInputs(editedData?.dna || [""]);
    setDynamicRNAInputs(editedData?.rna || [""]);
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

    // Clear dynamicDNAInputs and dynamicRNAInputs
    setDynamicDNAInputs([""]);
    setDynamicRNAInputs([""]);

    // Exit edit mode if currently in edit mode
    setEditingId(null);
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
        <label htmlFor="nama">Nama Asam Amino</label>
        <input
          className="border-2"
          type="text"
          id="nama"
          value={formValues.nama}
          onChange={handleInputChange}
        />
        <div className="flex ">
          <div className="flex flex-col w-1/2 me-3">
            <label htmlFor="abbr1">Singkatan 1</label>
            <input
              className="border-2"
              type="text"
              id="abbr1"
              maxLength={1}
              value={formValues.abbr1}
              pattern="[A-Za-z]+"
              onChange={handleInputChange}
            />
            <label htmlFor="abbr3">Singkatan 3</label>
            <input
              className="border-2"
              type="text"
              id="abbr3"
              maxLength={3}
              value={formValues.abbr3}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex flex-col w-1/2">
            <label htmlFor="dna">DNA (A, C, T, dan G)</label>
            {dynamicDNAInputs.map((input, index) => (
              <div key={index} className="flex">
                <input
                  className="border-2"
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
                    className="mx-2"
                  >
                    +
                  </button>
                )}
                {dynamicDNAInputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDynamicDNAInput(index)}
                    className="mx-2"
                  >
                    -
                  </button>
                )}
              </div>
            ))}
            <label htmlFor="rna">RNA (A, C, U, dan G)</label>
            {dynamicRNAInputs.map((input, index) => (
              <div key={index} className="flex">
                <input
                  className="border-2"
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
                    className="mx-2"
                  >
                    +
                  </button>
                )}
                {dynamicRNAInputs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDynamicRNAInput(index)}
                    className="mx-2"
                  >
                    -
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <label htmlFor="abt">About</label>
        <textarea
          className="border-2"
          id="abt"
          value={formValues.abt}
          onChange={handleInputChange}
        />
        <button className="rounded-md h-[30px] my-3 bg-[#cea3a3]" type="submit">
          Submit
        </button>
      </form>

      <div className="p-5">
        <h2>Display Data:</h2>
        <table className="w-full text-center border">
          <thead>
            <tr>
              <th className="border">Nama Asam Amino</th>
              <th className="border">Singkatan 1 Huruf</th>
              <th className="border">Singkatan 3 Huruf</th>
              <th className="border">DNA</th>
              <th className="border">RNA</th>
              <th className="border">About</th>
              <th className="border">Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td className="border">{item.nama}</td>
                <td className="border">{item.abbr1}</td>
                <td className="border">{item.abbr3}</td>
                <td className="border">{item.dna.join(", ")}</td>
                <td className="border">{item.rna.join(", ")}</td>
                <td className="line-clamp-3  border">{item.abt}</td>
                <td className="border">
                  {editingId === item.id ? (
                    // Tombol "Cancel" saat dalam mode edit
                    <button onClick={handleCancel}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="25px"
                        height="25px"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill="#ffc800"
                          d="m8.4 17l3.6-3.6l3.6 3.6l1.4-1.4l-3.6-3.6L17 8.4L15.6 7L12 10.6L8.4 7L7 8.4l3.6 3.6L7 15.6zm3.6 5q-2.075 0-3.9-.788t-3.175-2.137q-1.35-1.35-2.137-3.175T2 12q0-2.075.788-3.9t2.137-3.175q1.35-1.35 3.175-2.137T12 2q2.075 0 3.9.788t3.175 2.137q1.35 1.35 2.138 3.175T22 12q0 2.075-.788 3.9t-2.137 3.175q-1.35 1.35-3.175 2.138T12 22"
                        />
                      </svg>
                    </button>
                  ) : (
                    // Tombol "Edit" saat tidak dalam mode edit
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
                  )}
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
