// pages/add-enzyme.tsx
import { db } from "@/app/lib/firebase/init";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";

const FormEnzyme = () => {
  const [newEnzyme, setNewEnzyme] = useState({
    name: "",
    sequence3: "",
    sequence5: "",
    overhang: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEnzyme({ ...newEnzyme, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const enzymeCollection = collection(db, "allEnzymeTypes");
      await addDoc(enzymeCollection, newEnzyme);
      alert("Enzyme added successfully!");
      setNewEnzyme({ name: "", sequence3: "", sequence5: "", overhang: "" });
    } catch (error) {
      console.error("Error adding enzyme:", error);
    }
  };

  return (
    <div>
      <h1>Add New Enzyme</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={newEnzyme.name}
            onChange={handleChange}
            className="border"
          />
        </div>
        <div>
          <label>Sequence 5:</label>
          <input
            type="text"
            name="sequence5"
            value={newEnzyme.sequence5}
            onChange={handleChange}
            className="border"
          />
        </div>
        <div>
          <label>Sequence 3:</label>
          <input
            type="text"
            name="sequence3"
            value={newEnzyme.sequence3}
            onChange={handleChange}
            className="border"
          />
        </div>
        <div>
          <label>Overhang:</label>
          <input
            type="text"
            name="overhang"
            value={newEnzyme.overhang}
            onChange={handleChange}
            className="border"
          />
        </div>
        <button
          className="rounded-md h-[40px] w-full my-3 bg-[#098c28] text-white"
          type="submit"
        >
          Add Enzyme
        </button>
      </form>
    </div>
  );
};

export default FormEnzyme;
