// pages/view-enzymes.tsx
import { db } from "@/app/lib/firebase/init";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

const DataEnzyme = () => {
  const [enzymes, setEnzymes] = useState<any[]>([]);

  useEffect(() => {
    const enzymeCollection = collection(db, "allEnzymeTypes");

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      enzymeCollection,
      (snapshot) => {
        const enzymeList = snapshot.docs.map((doc) => doc.data());
        setEnzymes(enzymeList);
      },
      (error) => {
        console.error("Error fetching enzymes:", error);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1>Enzyme List</h1>

      <table className="w-full text-center">
        <thead className="border-b-2">
          <tr>
            <th>Enzyme</th>
            <th>Sequence 5&apos;</th>
            <th>Sequence 3&apos;</th>
            <th>Overhang</th>
          </tr>
        </thead>
        <tbody>
          {enzymes.map((enzyme, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-[#b6b6b6]" : ""}>
              <td>{enzyme.name}</td>
              <td>{enzyme.sequence5}</td>
              <td>{enzyme.sequence3}</td>
              <td>{enzyme.overhang}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataEnzyme;
