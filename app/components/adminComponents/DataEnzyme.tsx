// pages/view-enzymes.tsx
import { db } from "@/app/lib/firebase/init";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

const DataEnzyme = () => {
  const [enzymes, setEnzymes] = useState<any[]>([]);
  const [editingEnzyme, setEditingEnzyme] = useState<any>(null);
  const [editedEnzyme, setEditedEnzyme] = useState({
    name: "",
    sequence5: "",
    sequence3: "",
    overhang: "",
  });

  useEffect(() => {
    const enzymeCollection = collection(db, "allEnzymeTypes");

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      enzymeCollection,
      (snapshot) => {
        const enzymeList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEnzymes(enzymeList);
      },
      (error) => {
        console.error("Error fetching enzymes:", error);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  const handleEdit = (enzyme: any) => {
    setEditingEnzyme(enzyme);
    setEditedEnzyme({
      name: enzyme.name,
      sequence5: enzyme.sequence5,
      sequence3: enzyme.sequence3,
      overhang: enzyme.overhang,
    });
  };

  const handleCancel = () => {
    setEditingEnzyme(null);
    setEditedEnzyme({
      name: "",
      sequence5: "",
      sequence3: "",
      overhang: "",
    });
  };

  const handleUpdate = async () => {
    if (editingEnzyme) {
      const enzymeDoc = doc(db, "allEnzymeTypes", editingEnzyme.id);
      try {
        await updateDoc(enzymeDoc, editedEnzyme);
        handleCancel();
      } catch (error) {
        console.error("Error updating enzyme:", error);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedEnzyme((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  return (
    <div>
      <h1>Enzyme List</h1>

      {editingEnzyme && (
        <div>
          <input
            type="text"
            name="name"
            value={editedEnzyme.name}
            onChange={handleInputChange}
            placeholder="Enzyme Name"
          />
          <input
            type="text"
            name="sequence5"
            value={editedEnzyme.sequence5}
            onChange={handleInputChange}
            placeholder="Sequence 5'"
          />
          <input
            type="text"
            name="sequence3"
            value={editedEnzyme.sequence3}
            onChange={handleInputChange}
            placeholder="Sequence 3'"
          />
          <input
            type="text"
            name="overhang"
            value={editedEnzyme.overhang}
            onChange={handleInputChange}
            placeholder="Overhang"
          />
          <button onClick={handleUpdate}>Update</button>
          <button onClick={handleCancel}>Cancel</button>
        </div>
      )}

      <table className="w-full text-center">
        <thead className="border-b-2">
          <tr>
            <th>Enzyme</th>
            <th>Sequence 5&apos;</th>
            <th>Sequence 3&apos;</th>
            <th>Overhang</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {enzymes.map((enzyme, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-[#b6b6b6]" : ""}>
              <td>{enzyme.name}</td>
              <td>{enzyme.sequence5}</td>
              <td>{enzyme.sequence3}</td>
              <td>{enzyme.overhang}</td>
              <td>
                <button onClick={() => handleEdit(enzyme)}>
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
                <button>
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
  );
};

export default DataEnzyme;
