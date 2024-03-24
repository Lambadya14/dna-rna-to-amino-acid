"use client";
import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase/init";

const optionsData = [
  {
    category: "Mitochondrial Codes",
    options: [
      {
        value: "vertebrateMitochondrial",
        label: "The Vertebrate Mitochondrial Code",
      },
      { value: "yeastMitochondrial", label: "The Yeast Mitochondrial Code" },
      {
        value: "moldProtozoanCoelenterateMitochondrial",
        label:
          "The Mold, Protozoan, and Coelenterate Mitochondrial Code and the Mycoplasma/Spiroplasma Code",
      },
      {
        value: "invertebrateMitochondrial",
        label: "The Invertebrate Mitochondrial Code",
      },
      {
        value: "echinodermFlatwormMitochondrial",
        label: "The Echinoderm and Flatworm Mitochondrial Code",
      },
      {
        value: "ascidianMitochondrial",
        label: "The Ascidian Mitochondrial Code",
      },
      {
        value: "alternativeFlatwormMitochondrial",
        label: "The Alternative Flatworm Mitochondrial Code",
      },
      {
        value: "trematodeMitochondrial",
        label: "Trematode Mitochondrial Code",
      },
      {
        value: "scenedesmusObliquusMitochondrial",
        label: "Scenedesmus obliquus Mitochondrial Code",
      },
      {
        value: "thraustochytriumMitochondrial",
        label: "Thraustochytrium Mitochondrial Code",
      },
      {
        value: "rhabdopleuridaeMitochondrial",
        label: "Rhabdopleuridae Mitochondrial Code",
      },
      {
        value: "cephalodiscidaeMitochondrialUAATyr",
        label: "Cephalodiscidae Mitochondrial UAA-Tyr Code",
      },
    ],
  },
  {
    category: "Nuclear Codes",
    options: [
      {
        value: "ciliateDasycladaceanHexamitaNuclear",
        label: "The Ciliate, Dasycladacean and Hexamita Nuclear Code",
      },
      { value: "euplotidNuclear", label: "The Euplotid Nuclear Code" },
      {
        value: "alternativeYeastNuclear",
        label: "The Alternative Yeast Nuclear Code",
      },
      { value: "blepharismaNuclear", label: "Blepharisma Nuclear Code" },
      {
        value: "pachysolenTannophilusNuclear",
        label: "Pachysolen tannophilus Nuclear Code",
      },
      { value: "karyorelictNuclear", label: "Karyorelict Nuclear Code" },
      { value: "condylostomaNuclear", label: "Condylostoma Nuclear Code" },
      { value: "mesodiniumNuclear", label: "Mesodinium Nuclear Code" },
      { value: "peritrichNuclear", label: "Peritrich Nuclear Code" },
      {
        value: "blastocrithidiaNuclear",
        label: "Blastocrithidia Nuclear Code",
      },
    ],
  },
  {
    category: "Others",
    options: [
      { value: "standardCode", label: "The Standard Code" },
      {
        value: "bacterialArchaealPlantPlastid",
        label: "The Bacterial, Archaeal and Plant Plastid Code",
      },
      {
        value: "chlorophyceanMitochondrial",
        label: "Chlorophycean Mitochondrial Code",
      },
      {
        value: "candidateDivisionSR1Gracilibacteria",
        label: "Candidate Division SR1 and Gracilibacteria Code",
      },
    ],
  },
];

const FormDataInput = () => {
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async () => {
    try {
      setLoading(true);

      const allCodeTypesCollection = collection(db, "allCodeTypes");

      // Menyimpan data sesuai dengan struktur yang diinginkan
      const data = {
        Mitochondrial: optionsData.find(
          (item) => item.category === "Mitochondrial Codes"
        ),
        Nuclear: optionsData.find((item) => item.category === "Nuclear Codes"),
        Others: optionsData.find((item) => item.category === "Others"),
      };

      // Menambahkan dokumen ke koleksi allCodeTypes
      await addDoc(allCodeTypesCollection, data);

      setLoading(false);
      console.log("Data successfully uploaded to Firestore");
    } catch (error) {
      console.error("Error uploading data to Firestore:", error);
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Upload Data to Firestore</h2>
      <button
        onClick={handleFormSubmit}
        disabled={loading}
        className="border-2 w-[200px]"
      >
        {loading ? "Uploading..." : "Upload Data"}
      </button>
    </div>
  );
};

export default FormDataInput;
