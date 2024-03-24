"use client"
import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase/init";

interface CodeItem {
  value: string;
  label: string;
}

interface FormData {
  category: string;
  codes: CodeItem[];
}

const FormDataInput = () => {
  const initialValues: FormData[] = [
    {
      category: "Mitochondrial Codes",
      codes: [
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
      codes: [
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
      codes: [
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

  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async () => {
    try {
      setLoading(true);

      // Combine all codes into a single array
      const allCodes = initialValues.reduce<CodeItem[]>(
        (accumulator, formData) => {
          return accumulator.concat(formData.codes);
        },
        []
      );

      // Upload all codes to Firestore under 'allCodeType' collection
      const allCodesCollection = collection(db, "allCodeType");
      await Promise.all(
        allCodes.map((codeItem) => addDoc(allCodesCollection, codeItem))
      );

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
