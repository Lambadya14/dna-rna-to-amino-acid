// "use client";
// import React, { useState, useEffect } from "react";
// import {
//   collection,
//   getDocs,
//   updateDoc,
//   doc,
//   DocumentData,
// } from "firebase/firestore";
// import { db } from "../lib/firebase/init";

// interface Option {
//   value: string;
//   label: string;
// }

// interface FormData {
//   category: string;
//   options: Option[];
// }

// interface FormDataState {
//   Mitochondrial: FormData;
//   Nuclear: FormData;
//   Others: FormData;
// }

// const FormDataInput = () => {
//   const [loading, setLoading] = useState(false);
//   const [formData, setFormData] = useState<FormDataState>({
//     Mitochondrial: { category: "", options: [] },
//     Nuclear: { category: "", options: [] },
//     Others: { category: "", options: [] },
//   });

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const allCodeTypesCollection = collection(db, "allCodeTypes");
//       const querySnapshot = await getDocs(allCodeTypesCollection);

//       let fetchedData: FormDataState = {
//         Mitochondrial: { category: "", options: [] },
//         Nuclear: { category: "", options: [] },
//         Others: { category: "", options: [] },
//       };

//       querySnapshot.forEach((doc: DocumentData) => {
//         const data: FormDataState = doc.data() as FormDataState;
//         fetchedData = data;
//       });

//       setFormData(fetchedData);
//       setLoading(false);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//       setLoading(false);
//     }
//   };

//   const handleAddOption = (category: keyof FormDataState) => {
//     setFormData((prevData) => {
//       return {
//         ...prevData,
//         [category]: {
//           ...prevData[category],
//           options: [...prevData[category].options, { value: "", label: "" }],
//         },
//       };
//     });
//   };

//   const handleRemoveOption = (category: keyof FormDataState, index: number) => {
//     setFormData((prevData) => {
//       return {
//         ...prevData,
//         [category]: {
//           ...prevData[category],
//           options: prevData[category].options.filter((_, idx) => idx !== index),
//         },
//       };
//     });
//   };

//   const handleInputChange = (
//     category: keyof FormDataState,
//     index: number,
//     field: keyof Option,
//     value: string
//   ) => {
//     setFormData((prevData) => {
//       return {
//         ...prevData,
//         [category]: {
//           ...prevData[category],
//           options: prevData[category].options.map((item, idx) =>
//             idx === index ? { ...item, [field]: value } : item
//           ),
//         },
//       };
//     });
//   };

//   const handleFormSubmit = async () => {
//     try {
//       setLoading(true);
//       const allCodeTypesCollection = collection(db, "allCodeTypes");

//       // Buat array dokumen baru untuk menyimpan data
//       const newData: { category: string; options: Option[] }[] = [];

//       // Loop melalui setiap kategori
//       Object.keys(formData).forEach((category) => {
//         const { category: categoryValue, options } =
//           formData[category as keyof FormDataState];

//         // Buat objek untuk setiap kategori
//         const categoryData = { category: categoryValue, options };

//         // Tambahkan objek kategori ke array data baru
//         newData.push(categoryData);
//       });

//       // Perbarui dokumen "codes" dengan data baru
//       await updateDoc(doc(db, "allCodeTypes", "codes"), { data: newData });

//       setLoading(false);
//       console.log("Data successfully updated in Firestore");
//     } catch (error) {
//       console.error("Error updating data in Firestore:", error);
//       setLoading(false);
//     }
//   };

//   return (
//     <div>
//       <h2>Manage Data</h2>
//       {loading ? (
//         <p>Loading...</p>
//       ) : (
//         <>
//           <table>
//             <thead>
//               <tr>
//                 <th>Category</th>
//                 <th>Options</th>
//                 <th>Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {Object.keys(formData).map((category) => (
//                 <tr key={category}>
//                   <td>{category}</td>
//                   <td>
//                     <ul>
//                       {formData[category].options.map((option, index) => (
//                         <li key={index}>
//                           <input
//                             type="text"
//                             value={option.value}
//                             onChange={(e) =>
//                               handleInputChange(
//                                 category as keyof FormDataState,
//                                 index,
//                                 "value",
//                                 e.target.value
//                               )
//                             }
//                           />
//                           <input
//                             type="text"
//                             value={option.label}
//                             onChange={(e) =>
//                               handleInputChange(
//                                 category as keyof FormDataState,
//                                 index,
//                                 "label",
//                                 e.target.value
//                               )
//                             }
//                           />
//                           <button
//                             onClick={() =>
//                               handleRemoveOption(
//                                 category as keyof FormDataState,
//                                 index
//                               )
//                             }
//                           >
//                             Remove
//                           </button>
//                         </li>
//                       ))}
//                     </ul>
//                     <button
//                       onClick={() =>
//                         handleAddOption(category as keyof FormDataState)
//                       }
//                     >
//                       Add Option
//                     </button>
//                   </td>
//                   <td>
//                     <button onClick={() => handleFormSubmit(category)}>
//                       Save Changes
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </>
//       )}
//     </div>
//   );
// };

// export default FormDataInput;
