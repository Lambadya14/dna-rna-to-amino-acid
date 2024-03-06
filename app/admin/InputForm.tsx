// components/InputForm.tsx
import { useEffect, useState } from "react";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase/init"; // Sesuaikan path ke file firebase.ts

interface AminoAcidData {
  id: string;
  nama: string;
  abbr1: string;
  abbr3: string;
  dna: string;
  rna: string;
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [id]: value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const docRef = await addDoc(collection(db, "aminoAcid"), {
        ...formValues,
        timestamp: new Date(),
      });
      console.log("Document written with ID: ", docRef.id);
    } catch (error) {
      console.error("Error adding document: ", error);
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

  return (
    <>
      {" "}
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
            <label htmlFor="dna">DNA</label>
            <input
              className="border-2"
              type="text"
              id="dna"
              value={formValues.dna}
              maxLength={3}
              onChange={handleInputChange}
            />
            <label htmlFor="rna">RNA</label>
            <input
              className="border-2"
              type="text"
              id="rna"
              value={formValues.rna}
              maxLength={3}
              onChange={handleInputChange}
            />
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
      <div>
        <h2>Display Data:</h2>
        <table className="w-full text-center">
          <thead>
            <tr>
              <th>Nama Asam Amino</th>
              <th>Singkatan 1 Huruf</th>
              <th>Singkatan 3 Huruf</th>
              <th>DNA</th>
              <th>RNA</th>
              <th>About</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.id}>
                <td>{item.nama}</td>
                <td>{item.abbr1}</td>
                <td>{item.abbr3}</td>
                <td>{item.dna}</td>
                <td>{item.rna}</td>
                <td>{item.abt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default InputForm;
